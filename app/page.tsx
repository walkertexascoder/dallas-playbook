import Calendar from "@/components/Calendar";

export default function Home() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dallas Playbook
        </h1>
        <p className="text-gray-600 mt-1">
          Find registration dates and seasons for youth sports leagues across the DFW area
        </p>
      </div>
      <Calendar />
    </div>
  );
}
