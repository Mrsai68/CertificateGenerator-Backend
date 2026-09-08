import StudentProfile from '../models/StudentProfile.js';
import IssuedCertificate from '../models/IssuedCertificate.js';

export const mapToRequestDTO = async (reqDoc) => {
  const user = reqDoc.user;
  let fullName = user?.username || 'N/A';
  let enrollmentNo = 'N/A';
  let department = user?.department || 'Engineering';
  let yearOfStudy = 'N/A';
  let academicYear = '2025-2026';

  if (user) {
    const profile = await StudentProfile.findOne({ user: user._id || user });
    if (profile) {
      fullName = profile.fullName;
      enrollmentNo = profile.enrollmentNo;
      department = profile.department;
      yearOfStudy = profile.yearOfStudy;
      academicYear = profile.academicYear || '2025-2026';
    }
  }

  const issuedCert = await IssuedCertificate.findOne({ request: reqDoc._id });

  return {
    requestId: reqDoc._id,
    userId: user?._id || user,
    username: user?.username || 'N/A',
    fullName,
    enrollmentNo,
    department,
    yearOfStudy,
    academicYear,
    purpose: reqDoc.purpose,
    status: reqDoc.status,
    appliedDate: reqDoc.appliedDate,
    approvedDate: reqDoc.approvedDate,
    remarks: reqDoc.remarks,
    certificateNumber: issuedCert?.certificateNumber || null,
    verificationToken: issuedCert?.verificationToken || null
  };
};
