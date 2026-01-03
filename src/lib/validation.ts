import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

/**
 * Validate if a string is a valid MongoDB ObjectId
 */
export function validateObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return mongoose.Types.ObjectId.isValid(id) && 
         new mongoose.Types.ObjectId(id).toString() === id;
}

/**
 * Validate ObjectId and return error response if invalid
 */
export function validateObjectIdOrError(id: string, fieldName: string = 'id'): NextResponse | null {
  if (!validateObjectId(id)) {
    return NextResponse.json(
      { error: `Invalid ${fieldName}. Must be a valid MongoDB ObjectId.` },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validate multiple ObjectIds
 */
export function validateObjectIds(ids: string[]): boolean {
  return ids.every(id => validateObjectId(id));
}

