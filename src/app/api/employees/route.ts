import { NextResponse } from 'next/server';

// Prisma is optional — the site works without a database
let prisma: ReturnType<typeof getPrisma> | null = null;

function getPrisma() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    if (!prisma) prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: "Database not configured. Please set up DATABASE_URL environment variable." 
      }, { status: 503 });
    }
    
    const employees = await (prisma as any).employee.findMany({
      select: {
        id: true,
        employeeNo: true,
        fullName: true,
        designation: true,
        branch: true,
        department: true,
        profilePhotoUri: true,
      }
    });
    
    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!prisma) prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: "Database not configured." 
      }, { status: 503 });
    }
    
    const body = await request.json();
    
    const newEmployee = await (prisma as any).employee.create({
      data: {
        fullName: body.fullName,
        idNumber: body.idNumber,
        gender: body.gender,
        dateOfBirth: new Date(body.dateOfBirth),
        address: body.address,
        phoneNumber: body.phoneNumber,
        email: body.email,
        joinDate: new Date(body.joinDate),
        designation: body.designation,
        branch: body.branch,
        employeeNo: body.employeeNo,
        department: body.department,
      }
    });
    
    return NextResponse.json({ success: true, data: newEmployee }, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ success: false, error: "Failed to create employee" }, { status: 500 });
  }
}
