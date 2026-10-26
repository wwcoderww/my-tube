import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function useSetParams() {
  const router = useRouter();
  const pathName = usePathname();
  const setParams = useSearchParams();
  const params = new URLSearchParams(setParams);

  function setParam(key: string, value: string) {
    params.set(key, value);
    router.push(`${pathName}?${params.toString()}`);
  }

  return setParam;
}
