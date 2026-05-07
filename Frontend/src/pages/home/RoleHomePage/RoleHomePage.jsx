import { roleMap } from '../../../data/roleProfiles';
import HomeFeatureCard from './components/HomeFeatureCard';

const RoleHomePage = ({ user, onLogout }) => {
  const profile = roleMap[user.role] || roleMap.Student;

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 px-8 py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1 bg-white rounded-2xl border border-sky-200/50 p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center px-3 py-1 bg-sky-500 text-white text-xs font-bold rounded-full">
                {profile.accent}
              </span>
              <h1 className="text-3xl font-bold text-slate-900 mt-4 mb-2">Hello, {user.name}</h1>
              <p className="text-sm text-slate-600">
                You are signed in as {profile.label}.
              </p>
            </div>

            <div className="bg-blue-50 border border-sky-200 rounded-xl p-4">
              <p className="text-xs font-bold text-sky-700 mb-1">Current role</p>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{profile.defaultHome}</h3>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full px-4 py-3 border-2 border-sky-300 text-sky-700 font-bold rounded-lg hover:bg-sky-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-sky-200/50 p-8 shadow-sm">
          <div className="space-y-8">
            <div>
              <span className="inline-flex items-center px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
                {profile.label} dashboard
              </span>
              <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-3">What this home page will control</h2>
              <p className="text-sm text-slate-600">
                The next screens will be built per role using this same auth shell, so each user lands in the right place after login.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile.cards.map((card) => (
                <HomeFeatureCard key={card} title={card} />
              ))}
            </div>

            <div className="bg-cyan-50 border border-sky-200 rounded-xl p-6">
              <p className="text-xs font-bold text-sky-700 mb-2">Backend connection</p>
              <p className="text-sm text-slate-700">
                Login already calls `POST /api/auth/login`. The returned user role is used to switch the home screen automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RoleHomePage;