import { PrismaClient } from "@prisma/client";

async function main() {
  const masterUrl = "sqlserver://127.0.0.1:1435;database=FuelStationMasterDB;user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true";
  const master = new PrismaClient({ datasources: { db: { url: masterUrl } } });

  const tenants = await master.tenant.findMany();
  console.log("Tenants in MasterDB:", tenants);

  for (const t of tenants) {
    const tUrl = `sqlserver://127.0.0.1:1435;database=${t.databaseName};user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true`;
    const tDb = new PrismaClient({ datasources: { db: { url: tUrl } } });
    try {
      const stations: any[] = await tDb.$queryRawUnsafe("SELECT id, slug, name, logoUrl FROM [dbo].[Station]");
      console.log(`Station rows in DB [${t.databaseName}]:`, stations);
      const settings: any[] = await tDb.$queryRawUnsafe("SELECT stationId, showLogo, templateId FROM [dbo].[StationInvoiceSettings]");
      console.log(`Invoice settings in DB [${t.databaseName}]:`, settings);
      const activeSessions: any[] = await tDb.session.findMany({
        include: { user: { include: { station: true } } }
      });
      console.log(`Active sessions in DB [${t.databaseName}]:`, activeSessions.map(s => ({
        sessionId: s.id,
        user: s.user.username,
        stationSlug: s.user.station.slug,
        stationLogo: (s.user.station as any).logoUrl,
      })));
    } catch (e) {
      console.error(`Error querying [${t.databaseName}]:`, e);
    } finally {
      await tDb.$disconnect();
    }
  }

  await master.$disconnect();
}

main().catch(console.error);
