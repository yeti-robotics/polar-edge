"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
};

type Props = {
  onSuccess: () => void;
};

export function ScheduleForm({ onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);

    await fetch("/api/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        assignedUserId: selectedUser,
      }),
    });

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Schedule title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Select value={selectedUser} onValueChange={setSelectedUser}>
        <SelectTrigger>
          <SelectValue placeholder="Select user" />
        </SelectTrigger>

        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Saving..." : "Save Schedule"}
      </Button>
    </div>
  );
}
