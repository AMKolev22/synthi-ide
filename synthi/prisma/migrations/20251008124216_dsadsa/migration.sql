-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "emails" TEXT[],

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_emails_key" ON "Waitlist"("emails");
