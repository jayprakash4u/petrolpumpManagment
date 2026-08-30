import { requireTenantDb } from "@/lib/tenant-db";
import { ProformaInvoiceView } from "@/components/sales/ProformaInvoiceView";

export default async function ProformaPage() {
  const { prisma: tenantDb, stationId } = await requireTenantDb();

  const [station, tanks, customers] = await Promise.all([
    tenantDb.station.findUnique({ where: { id: stationId } }),
    tenantDb.tank.findMany({ where: { stationId }, orderBy: { fuel: "asc" } }),
    tenantDb.customer.findMany({ where: { stationId, active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <ProformaInvoiceView
      stationName={station?.name || "Fuel Station Management"}
      tanks={tanks.map((t) => ({
        id: t.id,
        fuel: t.fuel,
        ratePerL: t.ratePerL.toString(),
      }))}
      customers={customers.map((c) => ({
        id: c.id,
        name: c.name,
      }))}
    />
  );
}
