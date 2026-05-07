export const roleProfiles = [
  {
    role: 'SuperAdmin',
    label: 'Super Admin',
    subtitle: 'Own the entire attendance workspace and create admins.',
    accent: 'Global control center',
    defaultHome: 'System overview and tenant controls',
    cards: [
      'Create and manage admins',
      'Monitor all classrooms',
      'Review attendance health'
    ]
  },
  {
    role: 'Admin',
    label: 'Admin',
    subtitle: 'Set up teachers, students, classrooms, and subjects.',
    accent: 'Operations desk',
    defaultHome: 'User onboarding and academic setup',
    cards: [
      'Create teachers and students',
      'Assign classrooms and subjects',
      'Keep attendance records organized'
    ]
  },
  {
    role: 'Teacher',
    label: 'Teacher',
    subtitle: 'Take attendance and keep class records accurate.',
    accent: 'Classroom control',
    defaultHome: 'Daily attendance and subject tracking',
    cards: [
      'Mark attendance in seconds',
      'Update submitted records',
      'Watch subject-level statistics'
    ]
  },
  {
    role: 'Student',
    label: 'Student',
    subtitle: 'Track your attendance and stay above the alert threshold.',
    accent: 'Student insight',
    defaultHome: 'Attendance summary and progress view',
    cards: [
      'See overall attendance',
      'Inspect subject-wise percentages',
      'Receive low-attendance alerts'
    ]
  }
];

export const defaultRole = roleProfiles[3];

export const roleMap = roleProfiles.reduce((accumulator, profile) => {
  accumulator[profile.role] = profile;
  return accumulator;
}, {});