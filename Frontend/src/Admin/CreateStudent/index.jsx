export default function CreateStudent() {
  return (
    <div className="ml-64 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">Create Student</h1>
        <p className="text-lg text-slate-600 mt-2">Add new student to the system</p>
      </div>

      <div className="bg-white/60 backdrop-blur rounded-2xl p-8 shadow-lg border border-sky-100">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input
                type="text"
                placeholder="Enter first name"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input
                type="text"
                placeholder="Enter last name"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter email"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Roll Number</label>
              <input
                type="text"
                placeholder="Enter roll number"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            {/* Class/Semester */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Class/Semester</label>
              <select className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60">
                <option>Select Class</option>
                <option>First Year</option>
                <option>Second Year</option>
                <option>Third Year</option>
                <option>Fourth Year</option>
              </select>
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
              <select className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60">
                <option>Select Branch</option>
                <option>Computer Science</option>
                <option>Electronics</option>
                <option>Mechanical</option>
                <option>Civil</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            {/* Parent Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Parent Email</label>
              <input
                type="email"
                placeholder="Enter parent email"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Create Student
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-white/60 text-slate-700 rounded-xl font-medium border border-sky-100 hover:bg-white/80 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
