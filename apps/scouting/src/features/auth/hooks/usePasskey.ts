import { Passkey } from "@better-auth/passkey";
import { startTransition, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

type StateFunction<T> = (prevState: T) => T;

type ExtractSuccessData<R> = R extends { error: null; data: infer D } ? D : never;

export function usePasskey() {
  const [passkeys, setPasskeys] = useState([] as Passkey[]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initialized = useRef(false);

  const updatePasskeyArr = (passkeyArr: StateFunction<Passkey[]>) => {
    setPasskeys((s) => passkeyArr(s).sort((a, b) => (a.name ?? "Z").localeCompare(b.name ?? "Z")));
  };

  const runPasskeyAction = async <R = unknown>(
    action: () => Promise<R>,
    updateFn: (prevState: Passkey[], newData: ExtractSuccessData<R>) => Passkey[],
    isFetch: boolean = false
  ) => {
    let result: R;

    try {
      setLoading(true);
      result = await action();
    } catch (e) {
      console.error("Passkey action error:", e);
      setError("An unknown error occurred");
      return;
    } finally {
      setLoading(false);
    }

    // Narrow the result shape so TypeScript can read `error` and `data`.
    const typedResult = result as unknown as {
      error?: { message?: unknown } | null;
      data?: unknown;
    };

    if (typedResult.error) {
      setError(
        typeof typedResult.error.message === "string"
          ? typedResult.error.message
          : "An unknown error occurred"
      );
      return;
    } else {
      setError("");
    }

    const data = typedResult.data as ExtractSuccessData<R>;

    updatePasskeyArr((p) => updateFn(p, data));

    if (!isFetch) {
      startTransition(fetchPasskeys);
    }
  };

  const fetchPasskeys = async () => {
    runPasskeyAction(authClient.passkey.listUserPasskeys, (_p, n) => n, true);
  };

  const createPasskey = async (name: string) => {
    runPasskeyAction(
      () => authClient.passkey.addPasskey({ name }),
      (passkeyArr, newData) => [...passkeyArr, newData]
    );
  };

  const renamePasskey = async (id: string, name: string) => {
    runPasskeyAction(
      () => authClient.passkey.updatePasskey({ id, name }),
      (passkeyArr, newData) => passkeyArr.map((pk) => (pk.id === id ? newData.passkey : pk))
    );
  };

  const deletePasskey = async (id: string) => {
    runPasskeyAction(
      () => authClient.passkey.deletePasskey({ id }),
      (passkeyArr, _) => passkeyArr.filter((pk) => pk.id !== id)
    );
  };

  useEffect(() => {
    if (!initialized.current) {
      console.log("Fetching passkeys...");
      fetchPasskeys();
      initialized.current = true;
    }
  }, []);

  return {
    passkeys,
    createPasskey,
    renamePasskey,
    deletePasskey,
    fetchPasskeys,
    loading,
    error,
  };
}
