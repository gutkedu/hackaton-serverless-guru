import { useState } from "react";
import { z } from "zod";
import { useCreateChannel } from "@/hooks/useCreateChannel";
import { createChannelSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";

export default function Home() {
  const [formData, setFormData] = useState({
    streamName: "",
    deviceName: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const createChannelMutation = useCreateChannel();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data using Zod
      const validData = createChannelSchema.parse(formData);
      setErrors({});

      // Submit the form
      createChannelMutation.mutate(validData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert Zod errors to a more user-friendly format
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Create Live Stream</h1>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="streamName" className="mb-2 block font-medium">
              Stream Name
            </label>
            <input
              type="text"
              id="streamName"
              name="streamName"
              value={formData.streamName}
              onChange={handleInputChange}
              className={cn(
                "w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                errors.streamName && "border-red-500"
              )}
            />
            {errors.streamName && (
              <p className="mt-1 text-sm text-red-500">{errors.streamName}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="deviceName" className="mb-2 block font-medium">
              Device Name (optional)
            </label>
            <input
              type="text"
              id="deviceName"
              name="deviceName"
              value={formData.deviceName}
              onChange={handleInputChange}
              className="w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={createChannelMutation.isPending}
            className="btn btn-primary"
          >
            {createChannelMutation.isPending ? "Creating..." : "Create Stream"}
          </button>
        </form>

        {createChannelMutation.isError && (
          <div className="mt-4 rounded-md bg-red-100 p-3 text-red-800">
            {createChannelMutation.error.message || "Failed to create stream"}
          </div>
        )}

        {createChannelMutation.isSuccess && (
          <div className="mt-4 rounded-md bg-green-100 p-4 text-green-800">
            <h3 className="font-medium">Stream Created Successfully!</h3>
            <div className="mt-2">
              <p>
                <strong>Stream Name:</strong>{" "}
                {createChannelMutation.data.streamName}
              </p>
              <p>
                <strong>Stream ARN:</strong>{" "}
                {createChannelMutation.data.streamArn}
              </p>
              <p>
                <strong>Channel ARN:</strong>{" "}
                {createChannelMutation.data.channelArn}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
