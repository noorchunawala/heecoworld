type ParentConfirmationEmailInput = {
  parentName: string;
  schools: string[];
};

export function buildParentConfirmationEmail(input: ParentConfirmationEmailInput) {
  const schoolList = input.schools
    .map((school) => `<li>${school}</li>`)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; background:#f8f1e7; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:white; border-radius:20px; overflow:hidden;">
        <div style="background:#071B33; padding:24px;">
          <h1 style="color:white; margin:0;">HeecoWorld</h1>
          <p style="color:#D6B46A; margin:8px 0 0;">Tour Request Submitted</p>
        </div>

        <div style="padding:24px; color:#071B33;">
          <p>Hi ${input.parentName},</p>

          <p>Your school tour request has been submitted successfully.</p>

          <p>Your request has been shared with:</p>

          <ul>
            ${schoolList}
          </ul>

          <p>The selected school(s) will contact you directly using the details you provided.</p>

          <div style="margin-top:24px; padding:16px; background:#f8f1e7; border-radius:14px;">
            If you do not hear back within 3 working days, please contact us at info@heecoworld.com.
          </div>

          <p style="margin-top:24px; font-size:13px; color:#64748b;">
            Thank you for using HeecoWorld — helping parents find, compare and visit the right schools.
          </p>
        </div>
      </div>
    </div>
  `;
}