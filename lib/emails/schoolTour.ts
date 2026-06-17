type SchoolTourEmailInput = {
  schoolName: string;
  parentName: string;
  mobile: string;
  email?: string | null;
  childGrade?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  message?: string | null;
};

export function buildSchoolTourEmail(input: SchoolTourEmailInput) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f8f1e7; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:white; border-radius:20px; overflow:hidden;">
        <div style="background:#071B33; padding:24px;">
          <h1 style="color:white; margin:0;">HeecoWorld</h1>
          <p style="color:#D6B46A; margin:8px 0 0;">New Parent Tour Request</p>
        </div>

        <div style="padding:24px; color:#071B33;">
          <p>A parent has requested a tour of <strong>${input.schoolName}</strong> through HeecoWorld.</p>

          <h3>Parent Details</h3>
          <p><strong>Name:</strong> ${input.parentName}</p>
          <p><strong>Mobile:</strong> ${input.mobile}</p>
          <p><strong>Email:</strong> ${input.email || "Not provided"}</p>
          <p><strong>Child Grade:</strong> ${input.childGrade || "Not provided"}</p>

          <h3>Requested Tour</h3>
          <p><strong>Preferred Date:</strong> ${input.preferredDate || "Not specified"}</p>
          <p><strong>Preferred Time:</strong> ${input.preferredTime || "Not specified"}</p>

          <h3>Message</h3>
          <p>${input.message || "No additional message provided."}</p>

          <div style="margin-top:24px; padding:16px; background:#f8f1e7; border-radius:14px;">
            Please contact the parent directly to arrange a suitable school tour.
          </div>

          <p style="margin-top:24px; font-size:13px; color:#64748b;">
            This enquiry was submitted via HeecoWorld — connecting parents with the right schools across the UAE.
          </p>
        </div>
      </div>
    </div>
  `;
}