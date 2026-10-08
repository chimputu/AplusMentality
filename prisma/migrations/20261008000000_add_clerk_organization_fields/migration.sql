-- Add Clerk Organization fields to Institution
ALTER TABLE "Institution" ADD COLUMN "clerkOrgId" TEXT UNIQUE;
ALTER TABLE "Institution" ADD COLUMN "clerkOrgSlug" TEXT;

-- Add Clerk Organization fields to User
ALTER TABLE "User" ADD COLUMN "clerkOrgId" TEXT;
ALTER TABLE "User" ADD COLUMN "clerkOrgRole" TEXT;
CREATE INDEX "User_clerkOrgId_idx" ON "User"("clerkOrgId");

-- Create OrganizationMembership table
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "clerkOrgSlug" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on userId + clerkOrgId
CREATE UNIQUE INDEX "OrganizationMembership_userId_clerkOrgId_key" ON "OrganizationMembership"("userId", "clerkOrgId");

-- Indexes for OrganizationMembership
CREATE INDEX "OrganizationMembership_clerkOrgId_status_idx" ON "OrganizationMembership"("clerkOrgId", "status");
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- Foreign key to User
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
