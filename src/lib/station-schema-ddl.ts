/**
 * SQL Server DDL script for initializing tenant station databases.
 * Used during automated Super Admin station provisioning.
 */
export const TENANT_DB_SCHEMA_DDL = `
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
`;
