const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeIdList,
  publicClinicWhere,
  serviceDoctorWhere,
  resolveWritableClinicId,
} = require("../src/domain/tenantContent");

test("normalizeIdList removes blanks and duplicates", () => {
  assert.deepEqual(normalizeIdList(["a", "", "a", " b ", null]), ["a", "b"]);
});

test("publicClinicWhere fails closed when a custom host has no clinic", () => {
  assert.deepEqual(publicClinicWhere({ clinicHostname: "unknown.example", tenantClinic: null }), {
    clinicId: "__unresolved_tenant__",
  });
});

test("publicClinicWhere binds recognized domains to their clinic", () => {
  assert.deepEqual(
    publicClinicWhere({ clinicHostname: "clinic.example", tenantClinic: { id: "clinic-a" } }),
    { clinicId: "clinic-a" }
  );
});

test("serviceDoctorWhere intersects service assignment and clinic membership", () => {
  assert.deepEqual(serviceDoctorWhere("clinic-a"), {
    doctor: { clinics: { some: { clinicId: "clinic-a" } } },
  });
});

test("tenant staff cannot override their clinic", () => {
  assert.equal(
    resolveWritableClinicId({ tenantClinic: { id: "clinic-a" }, requestedClinicId: "clinic-b", isAdmin: false }),
    "clinic-a"
  );
});

test("admin may choose a clinic when not on a tenant domain", () => {
  assert.equal(
    resolveWritableClinicId({ tenantClinic: null, requestedClinicId: "clinic-b", isAdmin: true }),
    "clinic-b"
  );
});
