import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import mongoose from 'mongoose';
import Client from '@/models/Client';
import License from '@/models/License';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import Update from '@/models/Update';
import Report from '@/models/Report';
import User from '@/models/User';
import Invoice from '@/models/Invoice';
import { paginationSchema, validateOrThrow } from '@/lib/validation-schemas';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// Ensure models are registered (helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  void Client;
  void License;
  void SdrClientAssignment;
  void Update;
  void Report;
  void User;
  void Invoice;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const sdrId = searchParams.get('sdrId');
    const statusFilter = searchParams.get('status');
    
    // Validate pagination parameters
    const pagination = validateOrThrow(paginationSchema, {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });
    const page = pagination.page ?? 1;
    const limit = Math.min(pagination.limit ?? 10, 100); // Enforce max limit of 100

    const match: Record<string, any> = {};
    if (search) {
      match.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { pointOfContactName: { $regex: search, $options: 'i' } },
        { pointOfContactEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const basePipeline: any[] = [
      { $match: match },
      // Licenses linked to client
      {
        $lookup: {
          from: 'licenses',
          localField: '_id',
          foreignField: 'clientId',
          as: 'licenses',
        },
      },
      // Assignments and SDR users
      {
        $lookup: {
          from: 'sdrclientassignments',
          localField: '_id',
          foreignField: 'clientId',
          as: 'assignments',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { sdrIds: '$assignments.sdrId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$_id', { $ifNull: ['$$sdrIds', []] }] },
                    { $eq: ['$role', 'SDR'] },
                  ],
                },
              },
            },
            { $project: { _id: 1, name: 1, email: 1 } },
          ],
          as: 'sdrUsers',
        },
      },
      // Updates count
      {
        $lookup: {
          from: 'updates',
          let: { cid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$clientId', '$$cid'] } } },
            { $count: 'count' },
          ],
          as: 'updatesAgg',
        },
      },
      // Reports count
      {
        $lookup: {
          from: 'reports',
          let: { cid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$clientId', '$$cid'] } } },
            { $count: 'count' },
          ],
          as: 'reportsAgg',
        },
      },
      // Payment information from invoices
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'clientId',
          as: 'invoices',
        },
      },
      {
        $addFields: {
          totalLicenses: {
            $cond: [
              { $gt: [{ $size: '$licenses' }, 0] },
              { $size: '$licenses' },
              { $ifNull: ['$numberOfLicenses', 0] },
            ],
          },
          totalTarget: { $ifNull: ['$targetThisMonth', { $ifNull: ['$numberOfLicenses', 0] }] },
          totalAchieved: { $ifNull: ['$achievedThisMonth', 0] },
          assignedSdr: { $arrayElemAt: ['$sdrUsers', 0] },
          // Payment summary
          paidInvoices: {
            $filter: {
              input: '$invoices',
              as: 'inv',
              cond: { $eq: ['$$inv.status', 'PAID'] },
            },
          },
          // Calculate payment dates and summary
          paymentDates: {
            $map: {
              input: {
                $filter: {
                  input: '$invoices',
                  as: 'inv',
                  cond: { $and: [{ $eq: ['$$inv.status', 'PAID'] }, { $ne: ['$$inv.paidAt', null] }] },
                },
              },
              as: 'inv',
              in: '$$inv.paidAt',
            },
          },
          lastPaymentDate: {
            $ifNull: [
              {
                $max: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$invoices',
                        as: 'inv',
                        cond: { $and: [{ $eq: ['$$inv.status', 'PAID'] }, { $ne: ['$$inv.paidAt', null] }] },
                      },
                    },
                    as: 'inv',
                    in: '$$inv.paidAt',
                  },
                },
              },
              null,
            ],
          },
          paymentCount: {
            $size: {
              $filter: {
                input: '$invoices',
                as: 'inv',
                cond: { $eq: ['$$inv.status', 'PAID'] },
              },
            },
          },
          // Achievement status calculation
          deadlineDate: '$targetDeadline',
        },
      },
      {
        $addFields: {
          // Calculate achievement status
          // If target is 0 or not set, show IN_PROGRESS (can't achieve a target that doesn't exist)
          // If target > 0 and achieved >= target, show ACHIEVED
          // If target > 0 and achieved < target and deadline passed, show OVERDUE
          // If target > 0 and achieved < target and deadline not passed, show IN_PROGRESS
          achievementStatus: {
            $cond: {
              if: {
                $and: [
                  { $gt: ['$totalTarget', 0] }, // Target must be greater than 0
                  { $gte: ['$totalAchieved', '$totalTarget'] }, // Achieved must be >= target
                ],
              },
              then: 'ACHIEVED',
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $gt: ['$totalTarget', 0] }, // Target must be greater than 0
                      { $lt: ['$totalAchieved', '$totalTarget'] }, // Achieved < target
                      { $ne: ['$deadlineDate', null] }, // Deadline must be set
                      { $lt: [{ $ifNull: ['$deadlineDate', new Date(9999, 0, 1)] }, new Date()] }, // Deadline passed
                    ],
                  },
                  then: 'OVERDUE',
                  else: 'IN_PROGRESS',
                },
              },
            },
          },
        },
      },
    ];

    // Filter by SDR if provided
    if (sdrId) {
      basePipeline.push({
        $match: {
          'assignedSdr._id': new mongoose.Types.ObjectId(sdrId),
        },
      });
    }

    // Filter by achievement status if provided
    if (statusFilter && ['ACHIEVED', 'IN_PROGRESS', 'OVERDUE'].includes(statusFilter)) {
      // Note: This filter needs to be applied after achievementStatus is calculated
      // So we'll filter after the status calculation
    }

    // Count total for pagination
    const countPipeline = [...basePipeline, { $count: 'total' }];
    const countResult = await Client.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const dataPipeline = [
      ...basePipeline,
      // Filter by status after calculation
      ...(statusFilter && ['ACHIEVED', 'IN_PROGRESS', 'OVERDUE'].includes(statusFilter)
        ? [{ $match: { achievementStatus: statusFilter } }]
        : []),
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          businessName: 1,
          pointOfContactName: 1,
          pointOfContactEmail: 1,
          totalLicenses: 1,
          totalTarget: 1,
          totalAchieved: 1,
          assignedSdr: 1,
          lastPaymentDate: 1,
          paymentCount: 1,
          achievementStatus: 1,
          deadlineDate: 1,
        },
      },
    ];

    const rows = await Client.aggregate(dataPipeline);

    return NextResponse.json(
      {
        success: true,
        page: safePage,
        limit,
        total,
        totalPages,
        data: rows,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Admin overview error', error);
    return handleApiError(error);
  }
}

