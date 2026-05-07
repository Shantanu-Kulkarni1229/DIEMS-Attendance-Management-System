const HomeFeatureCard = ({ title }) => {
  return (
    <article className="bg-blue-50 border border-sky-200 rounded-xl p-4">
      <p className="text-xs font-bold text-sky-700 mb-1">Home action</p>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">This section will be expanded into the full role dashboard in the next step.</p>
    </article>
  );
};

export default HomeFeatureCard;