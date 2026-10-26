import { getSearch } from "./_components/video-list/data/getSearch";
import List from "./_components/video-list/list";
import Searchbar from "./_components/video-list/searchbar";
import { PagePropsType } from "./page";

export default async function Search({ searchParams }: PagePropsType) {
  const params = await searchParams;
  const data = await getSearch(params.search);
  console.log(data);

  return (
    <div>
      <Searchbar />
      <List data={data.results} />
    </div>
  );
}
