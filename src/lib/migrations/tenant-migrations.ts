/**
 * The one ordered, versioned source of truth for what a tenant station
 * database's schema should look like.
 *
 * A schema change is: add the field to `prisma/schema.prisma` (so the
 * generated Prisma Client knows about it) *and* append one new migration
 * here (so every tenant database — existing and future — actually gets it).
 * There is no second place to remember: provisioning a brand-new station
 * (`provisionTenantDatabase` in tenant-db.ts) runs these same migrations in
 * order rather than executing a separately hand-maintained DDL snapshot, so
 * a new station can never end up missing a column an existing one has.
 *
 * Each migration's `sql` is split on the same `";\n\n"` convention the
 * provisioner already used, and run as a sequence of individual statements
 * inside one transaction (see runner.ts). Every `CREATE TABLE` / `ALTER
 * TABLE` here is guarded with `IF NOT EXISTS`, so a migration is safe to
 * apply to a database that already has its effect — that's what lets
 * `001_baseline` double as "build a brand-new database from nothing" *and*
 * "no-op against an existing one" with the same statements.
 */
export interface TenantMigration {
  id: string;
  description: string;
  sql: string;
}

export const TENANT_MIGRATIONS: TenantMigration[] = [
  {
    id: "001_baseline",
    description: "Core station schema: Station, User, Session, Tank, FuelRateHistory, Customer, Sale, Purchase, CustomerPayment, Shift, AuditLog, and the migration ledger itself.",
    sql: `
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Station')
BEGIN
    CREATE TABLE [dbo].[Station] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [slug] NVARCHAR(1000) NOT NULL UNIQUE,
        [name] NVARCHAR(1000) NOT NULL,
        [companyName] NVARCHAR(1000) NULL,
        [phone] NVARCHAR(1000) NULL,
        [email] NVARCHAR(1000) NULL,
        [address] NVARCHAR(1000) NOT NULL,
        [suspendedAt] DATETIME2 NULL,
        [suspendedReason] NVARCHAR(1000) NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        [nextReceiptNo] INT NOT NULL DEFAULT 1
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User')
BEGIN
    CREATE TABLE [dbo].[User] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [stationId] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [username] NVARCHAR(1000) NOT NULL,
        [email] NVARCHAR(1000) NULL,
        [phone] NVARCHAR(1000) NULL,
        [employeeId] NVARCHAR(1000) NULL,
        [passwordHash] NVARCHAR(1000) NOT NULL,
        [role] NVARCHAR(1000) NOT NULL,
        [permissions] NVARCHAR(MAX) NULL,
        [active] BIT NOT NULL DEFAULT 1,
        [onShift] BIT NOT NULL DEFAULT 0,
        [shiftStartedAt] DATETIME2 NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_User_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [UQ_User_station_username] UNIQUE ([stationId], [username])
    );
    CREATE INDEX [IX_User_stationId] ON [dbo].[User]([stationId]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Session')
BEGIN
    CREATE TABLE [dbo].[Session] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [userId] NVARCHAR(1000) NOT NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        [expiresAt] DATETIME2 NOT NULL,
        [revokedAt] DATETIME2 NULL,
        [userAgent] NVARCHAR(1000) NULL,
        [ipAddress] NVARCHAR(1000) NULL,
        CONSTRAINT [FK_Session_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_Session_userId] ON [dbo].[Session]([userId]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tank')
BEGIN
    CREATE TABLE [dbo].[Tank] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [stationId] NVARCHAR(1000) NOT NULL,
        [fuel] NVARCHAR(1000) NOT NULL,
        [capacityL] DECIMAL(12, 3) NOT NULL,
        [levelL] DECIMAL(12, 3) NOT NULL,
        [openingL] DECIMAL(12, 3) NOT NULL,
        [ratePerL] DECIMAL(10, 2) NOT NULL,
        [lowStockPct] DECIMAL(5, 2) NOT NULL DEFAULT 20.0,
        [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_Tank_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [UQ_Tank_station_fuel] UNIQUE ([stationId], [fuel])
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FuelRateHistory')
BEGIN
    CREATE TABLE [dbo].[FuelRateHistory] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [tankId] NVARCHAR(1000) NOT NULL,
        [oldRate] DECIMAL(10, 2) NOT NULL,
        [newRate] DECIMAL(10, 2) NOT NULL,
        [changedById] NVARCHAR(1000) NOT NULL,
        [changedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_FuelRateHistory_Tank] FOREIGN KEY ([tankId]) REFERENCES [dbo].[Tank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_FuelRateHistory_User] FOREIGN KEY ([changedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_FuelRateHistory_tankId] ON [dbo].[FuelRateHistory]([tankId]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customer')
BEGIN
    CREATE TABLE [dbo].[Customer] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [stationId] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [phone] NVARCHAR(1000) NULL,
        [creditLimit] DECIMAL(12, 2) NOT NULL DEFAULT 0.0,
        [dueAmount] DECIMAL(12, 2) NOT NULL DEFAULT 0.0,
        [active] BIT NOT NULL DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_Customer_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_Customer_stationId] ON [dbo].[Customer]([stationId]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sale')
BEGIN
    CREATE TABLE [dbo].[Sale] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [receiptNo] INT NOT NULL,
        [stationId] NVARCHAR(1000) NOT NULL,
        [tankId] NVARCHAR(1000) NOT NULL,
        [fuel] NVARCHAR(1000) NOT NULL,
        [liters] DECIMAL(12, 3) NOT NULL,
        [ratePerL] DECIMAL(10, 2) NOT NULL,
        [totalAmount] DECIMAL(12, 2) NOT NULL,
        [paymentMethod] NVARCHAR(1000) NOT NULL,
        [customerId] NVARCHAR(1000) NULL,
        [soldById] NVARCHAR(1000) NOT NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        [vehicleNo] NVARCHAR(1000) NULL,
        [voided] BIT NOT NULL DEFAULT 0,
        [voidedAt] DATETIME2 NULL,
        [voidReason] NVARCHAR(1000) NULL,
        CONSTRAINT [FK_Sale_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_Sale_Tank] FOREIGN KEY ([tankId]) REFERENCES [dbo].[Tank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_Sale_Customer] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_Sale_User] FOREIGN KEY ([soldById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [UQ_Sale_station_receiptNo] UNIQUE ([stationId], [receiptNo])
    );
    CREATE INDEX [IX_Sale_stationId_createdAt] ON [dbo].[Sale]([stationId], [createdAt]);
    CREATE INDEX [IX_Sale_customerId] ON [dbo].[Sale]([customerId]);
    CREATE INDEX [IX_Sale_stationId_vehicleNo] ON [dbo].[Sale]([stationId], [vehicleNo]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Purchase')
BEGIN
    CREATE TABLE [dbo].[Purchase] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [stationId] NVARCHAR(1000) NOT NULL,
        [tankId] NVARCHAR(1000) NOT NULL,
        [fuel] NVARCHAR(1000) NOT NULL,
        [liters] DECIMAL(12, 3) NOT NULL,
        [totalCost] DECIMAL(12, 2) NOT NULL,
        [supplier] NVARCHAR(1000) NOT NULL,
        [invoiceNo] NVARCHAR(1000) NULL,
        [recordedById] NVARCHAR(1000) NOT NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_Purchase_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_Purchase_Tank] FOREIGN KEY ([tankId]) REFERENCES [dbo].[Tank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_Purchase_User] FOREIGN KEY ([recordedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_Purchase_stationId_createdAt] ON [dbo].[Purchase]([stationId], [createdAt]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerPayment')
BEGIN
    CREATE TABLE [dbo].[CustomerPayment] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [customerId] NVARCHAR(1000) NOT NULL,
        [amount] DECIMAL(12, 2) NOT NULL,
        [recordedById] NVARCHAR(1000) NOT NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_CustomerPayment_Customer] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_CustomerPayment_User] FOREIGN KEY ([recordedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_CustomerPayment_customerId] ON [dbo].[CustomerPayment]([customerId]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Shift')
BEGIN
    CREATE TABLE [dbo].[Shift] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [userId] NVARCHAR(1000) NOT NULL,
        [startedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        [endedAt] DATETIME2 NULL,
        [endedById] NVARCHAR(1000) NULL,
        CONSTRAINT [FK_Shift_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_Shift_User_ended] FOREIGN KEY ([endedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_Shift_userId] ON [dbo].[Shift]([userId]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
BEGIN
    CREATE TABLE [dbo].[AuditLog] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [stationId] NVARCHAR(1000) NOT NULL,
        [actorId] NVARCHAR(1000) NULL,
        [action] NVARCHAR(1000) NOT NULL,
        [entityType] NVARCHAR(1000) NOT NULL,
        [entityId] NVARCHAR(1000) NOT NULL,
        [metadata] NVARCHAR(MAX) NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_AuditLog_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT [FK_AuditLog_User] FOREIGN KEY ([actorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
    );
    CREATE INDEX [IX_AuditLog_stationId_createdAt] ON [dbo].[AuditLog]([stationId], [createdAt]);
    CREATE INDEX [IX_AuditLog_entityType_entityId] ON [dbo].[AuditLog]([entityType], [entityId]);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '_schema_migrations')
BEGIN
    CREATE TABLE [dbo].[_schema_migrations] (
        [id] NVARCHAR(200) NOT NULL PRIMARY KEY,
        [appliedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
END;
`,
  },
  {
    id: "002_buyer_name",
    description: "Sale.buyerName — free-text buyer name captured at point of sale, independent of a linked Customer record.",
    sql: `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sale' AND COLUMN_NAME = 'buyerName')
BEGIN
    ALTER TABLE [dbo].[Sale] ADD [buyerName] NVARCHAR(1000) NULL;
END;
`,
  },
  {
    id: "003_discount_amount",
    description: "Sale.discountAmount — the discount already subtracted out of totalAmount, kept so it can still be itemized on the invoice.",
    sql: `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sale' AND COLUMN_NAME = 'discountAmount')
BEGIN
    ALTER TABLE [dbo].[Sale] ADD [discountAmount] DECIMAL(12, 2) NULL;
END;
`,
  },
  {
    id: "004_remarks",
    description: "Sale.remarks — free-text note captured at point of sale.",
    sql: `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Sale' AND COLUMN_NAME = 'remarks')
BEGIN
    ALTER TABLE [dbo].[Sale] ADD [remarks] NVARCHAR(1000) NULL;
END;
`,
  },
  {
    id: "005_customer_pan_address",
    description: "Customer.panNo / email / address — captured on the Add Customer form, shown on the tax invoice's Bill To block for B2B buyers.",
    sql: `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customer' AND COLUMN_NAME = 'panNo')
BEGIN
    ALTER TABLE [dbo].[Customer] ADD [panNo] NVARCHAR(1000) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customer' AND COLUMN_NAME = 'email')
BEGIN
    ALTER TABLE [dbo].[Customer] ADD [email] NVARCHAR(1000) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customer' AND COLUMN_NAME = 'address')
BEGIN
    ALTER TABLE [dbo].[Customer] ADD [address] NVARCHAR(1000) NULL;
END;
`,
  },
  {
    id: "006_station_invoice_settings",
    description: "Station business profile fields and StationInvoiceSettings table for multi-tenant configurable invoice templates.",
    sql: `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Station' AND COLUMN_NAME = 'panNo')
BEGIN
    ALTER TABLE [dbo].[Station] ADD [panNo] NVARCHAR(1000) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Station' AND COLUMN_NAME = 'vatNo')
BEGIN
    ALTER TABLE [dbo].[Station] ADD [vatNo] NVARCHAR(1000) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Station' AND COLUMN_NAME = 'dealerCode')
BEGIN
    ALTER TABLE [dbo].[Station] ADD [dealerCode] NVARCHAR(1000) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Station' AND COLUMN_NAME = 'logoUrl')
BEGIN
    ALTER TABLE [dbo].[Station] ADD [logoUrl] NVARCHAR(MAX) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StationInvoiceSettings')
BEGIN
    CREATE TABLE [dbo].[StationInvoiceSettings] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [stationId] NVARCHAR(1000) NOT NULL UNIQUE,
        [showPan] BIT NOT NULL DEFAULT 1,
        [showVat] BIT NOT NULL DEFAULT 1,
        [showVehicle] BIT NOT NULL DEFAULT 1,
        [showCustomerAddress] BIT NOT NULL DEFAULT 1,
        [showCustomerPan] BIT NOT NULL DEFAULT 1,
        [showCustomerPhone] BIT NOT NULL DEFAULT 1,
        [showSignature] BIT NOT NULL DEFAULT 1,
        [showAmountInWords] BIT NOT NULL DEFAULT 1,
        [showPaymentMode] BIT NOT NULL DEFAULT 1,
        [showDiscount] BIT NOT NULL DEFAULT 1,
        [showQrCode] BIT NOT NULL DEFAULT 1,
        [showRate] BIT NOT NULL DEFAULT 1,
        [primaryColor] NVARCHAR(100) NOT NULL DEFAULT '#1B4D8C',
        [accentColor] NVARCHAR(100) NOT NULL DEFAULT '#F59E0B',
        [paperSize] NVARCHAR(50) NOT NULL DEFAULT '80MM',
        [headerTitle] NVARCHAR(200) NOT NULL DEFAULT 'TAX INVOICE',
        [footerGreeting] NVARCHAR(500) NOT NULL DEFAULT 'Thank you for fueling with us! Safe Journey.',
        [termsNotes] NVARCHAR(1000) NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_StationInvoiceSettings_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
    );
END;
`,
  },
  {
    id: "007_tank_readings",
    description: "TankReading table — physical dip readings reconciled against book stock.",
    sql: `
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TankReading')
BEGIN
    CREATE TABLE [dbo].[TankReading] (
        [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
        [stationId] NVARCHAR(1000) NOT NULL,
        [tankId] NVARCHAR(1000) NOT NULL,
        [fuel] NVARCHAR(50) NOT NULL,
        [dipMm] DECIMAL(10,2) NULL,
        [physicalL] DECIMAL(12,3) NOT NULL,
        [bookStockL] DECIMAL(12,3) NOT NULL,
        [varianceL] DECIMAL(12,3) NOT NULL,
        [notes] NVARCHAR(500) NULL,
        [recordedById] NVARCHAR(1000) NOT NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT [FK_TankReading_Station] FOREIGN KEY ([stationId]) REFERENCES [dbo].[Station]([id]),
        CONSTRAINT [FK_TankReading_Tank] FOREIGN KEY ([tankId]) REFERENCES [dbo].[Tank]([id]),
        CONSTRAINT [FK_TankReading_User] FOREIGN KEY ([recordedById]) REFERENCES [dbo].[User]([id])
    );
    CREATE INDEX [IX_TankReading_station_createdAt] ON [dbo].[TankReading] ([stationId], [createdAt]);
    CREATE INDEX [IX_TankReading_tankId] ON [dbo].[TankReading] ([tankId]);
END;
`,
  },
  {
    id: "008_purchase_landed_cost",
    description: "Purchase Bill Entry: NOC bill detail (tanker/density/temperature/rate/VAT/scans), plus optional insurance and transportation charges, on the existing Purchase row.",
    sql: `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'purchaseDateBS')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [purchaseDateBS] NVARCHAR(20) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'tankerNo')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [tankerNo] NVARCHAR(100) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'density')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [density] DECIMAL(6, 3) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'temperature')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [temperature] DECIMAL(6, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'ratePerL')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [ratePerL] DECIMAL(10, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'subTotal')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [subTotal] DECIMAL(12, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'vatAmount')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [vatAmount] DECIMAL(12, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'invoiceImageUrl')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [invoiceImageUrl] NVARCHAR(MAX) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'scannedBillUrl')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [scannedBillUrl] NVARCHAR(MAX) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'insuranceBillNo')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [insuranceBillNo] NVARCHAR(100) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'insuranceCost')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [insuranceCost] DECIMAL(12, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'insuranceStamp')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [insuranceStamp] DECIMAL(12, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'insuranceTotal')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [insuranceTotal] DECIMAL(12, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'transporterName')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [transporterName] NVARCHAR(200) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'transportBillNo')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [transportBillNo] NVARCHAR(100) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'transportCost')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [transportCost] DECIMAL(12, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'transportTotal')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [transportTotal] DECIMAL(12, 2) NULL;
END;

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'remarks')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [remarks] NVARCHAR(1000) NULL;
END;
`,
  },
  {
    id: "009_purchase_supplier_pan",
    description: "Purchase.supplierPan — the fuel supplier's PAN number, captured alongside the supplier name on the bill.",
    sql: `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Purchase' AND COLUMN_NAME = 'supplierPan')
BEGIN
    ALTER TABLE [dbo].[Purchase] ADD [supplierPan] NVARCHAR(50) NULL;
END;
`,
  },
];
