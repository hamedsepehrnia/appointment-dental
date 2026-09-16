const UNRESOLVED_TENANT_ID = "__unresolved_tenant__";

const normalizeIdList = (values) => [
  ...new Set(
    (Array.isArray(values) ? values : [])
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  ),
];

const publicClinicWhere = ({ clinicHostname, tenantClinic }) => {
  if (tenantClinic?.id) return { clinicId: tenantClinic.id };
  if (clinicHostname) return { clinicId: UNRESOLVED_TENANT_ID };
  return {};
};

const serviceDoctorWhere = (clinicId) =>
  clinicId ? { doctor: { clinics: { some: { clinicId } } } } : {};

const resolveWritableClinicId = ({ tenantClinic, requestedClinicId, isAdmin }) => {
  if (tenantClinic?.id && !isAdmin) return tenantClinic.id;
  return requestedClinicId || tenantClinic?.id || null;
};

module.exports = {
  UNRESOLVED_TENANT_ID,
  normalizeIdList,
  publicClinicWhere,
  serviceDoctorWhere,
  resolveWritableClinicId,
};
