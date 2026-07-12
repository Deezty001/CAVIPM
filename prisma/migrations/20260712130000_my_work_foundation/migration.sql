ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'WAITING';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE "DependencyType" AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');

CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "initials" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMember" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Task" ADD COLUMN "assignedUserId" TEXT;
ALTER TABLE "Task" ADD COLUMN "plannedDate" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "estimateMinutes" INTEGER;
ALTER TABLE "Task" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "waitingOn" TEXT;
ALTER TABLE "Task" ADD COLUMN "waitingSince" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "followUpDate" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "TaskDependency" (
  "id" TEXT NOT NULL,
  "predecessorId" TEXT NOT NULL,
  "successorId" TEXT NOT NULL,
  "type" "DependencyType" NOT NULL DEFAULT 'FINISH_TO_START',
  "lagDays" INTEGER NOT NULL DEFAULT 0,
  "isHard" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonalAction" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "plannedDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "estimateMinutes" INTEGER,
  "completedAt" TIMESTAMP(3),
  "waitingOn" TEXT,
  "waitingSince" TIMESTAMP(3),
  "followUpDate" TIMESTAMP(3),
  "isPrivate" BOOLEAN NOT NULL DEFAULT true,
  "ownerId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "projectId" TEXT,
  "sourceTaskId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonalAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityEvent" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "actorId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
CREATE UNIQUE INDEX "TaskDependency_predecessorId_successorId_key" ON "TaskDependency"("predecessorId", "successorId");
CREATE INDEX "PersonalAction_ownerId_plannedDate_idx" ON "PersonalAction"("ownerId", "plannedDate");
CREATE INDEX "PersonalAction_ownerId_dueDate_idx" ON "PersonalAction"("ownerId", "dueDate");
CREATE INDEX "PersonalAction_workspaceId_status_idx" ON "PersonalAction"("workspaceId", "status");
CREATE INDEX "ActivityEvent_workspaceId_createdAt_idx" ON "ActivityEvent"("workspaceId", "createdAt");
CREATE INDEX "ActivityEvent_entityType_entityId_idx" ON "ActivityEvent"("entityType", "entityId");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalAction" ADD CONSTRAINT "PersonalAction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalAction" ADD CONSTRAINT "PersonalAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalAction" ADD CONSTRAINT "PersonalAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
