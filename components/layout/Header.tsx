import Link from "next/link";

export function Header() {
  return (
    <header className="flex gap-2 sm:gap-4 items-center w-full">
      <a
        href="https://dribbble.com/shots/23734171-Habitly-Habit-Tracker-App-UI-Kit"
        target="_blank"
      >
        <div className="text-slate-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M7.5 7v10M16.5 7v10"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M7.5 12h9"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </a>

      <ul className="flex gap-2 sm:gap-4">
        <li>
          <Link href={"/"}>Home</Link>
        </li>
        <li>
          <Link href={"/new"}>New</Link>
        </li>
      </ul>
    </header>
  );
}
