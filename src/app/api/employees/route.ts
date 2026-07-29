import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const employees = await prisma.employee.findMany({
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
    const body = await request.json();
    
    // In a real app, validate body using Zod before inserting
    const newEmployee = await prisma.employee.create({
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
