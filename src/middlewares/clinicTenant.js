const prisma = require("../config/database");

const normalizeHostname = (value) => {
  if (!value || typeof value !== "string") return null;
  const first = value.split(",")[0].trim().toLowerCase();
  const withoutProtocol = first.replace(/^https?:\/\//, "");
  const hostname = withoutProtocol.split("/")[0].split(":")[0].replace(/\.$/, "");
  return hostname || null;
};

const resolveClinicTenant = async (req, _res, next) => {
  try {
    // X-Clinic-Host preserves the website hostname when API and website use
    // different hosts. It selects public tenant data; authorization remains
    // enforced independently by sessions and role middleware.
    const requestedHost = req.get("X-Clinic-Host") || req.hostname || req.get("host");
    const hostname = normalizeHostname(requestedHost);
    req.clinicHostname = hostname;
    req.tenantClinic = hostname
      ? await prisma.clinic.findUnique({ where: { domain: hostname } })
      : null;

    if (req.tenantClinic && req.session?.userRole !== "ADMIN") {
      req.query.clinicId = req.tenantClinic.id;
      if (req.body && typeof req.body === "object") {
        req.body.clinicId = req.tenantClinic.id;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { normalizeHostname, resolveClinicTenant };
