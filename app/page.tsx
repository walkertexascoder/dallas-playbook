import Calendar from "@/components/Calendar";

export default function Home() {
  return (
    <div>
      <p className="text-gray-600 mb-6">
        Find registration dates and seasons for youth sports leagues across Dallas
      </p>
      <Calendar />
    </div>
  );
}
