const options = ["trending", "bookmarks", "history", "settings"];

export default function Links() {
  return (
    <>
      {options.map((option, index) => (
        <li
          key={index}
          className=" py-4 px-1 text-zinc-300 hover:cursor-pointer hover:text-zinc-400"
        >
          <p className="">{option}</p>
        </li>
      ))}
    </>
  );
}
