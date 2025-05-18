import { NextRequest, NextResponse } from "next/server";

// Get API base URL from environment variable, with a fallback
const API_BASE_URL = process.env.API_BASE_URL;
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const url = new URL(request.url);
  const queryString = url.search;

  try {
    // Forward the request to the actual API server
    const apiUrl = `${API_BASE_URL}/${path}${queryString}`;

    // Get all headers from the original request
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      // Skip host header as it will be set automatically
      if (key.toLowerCase() !== "host") {
        headers[key] = value;
      }
    });

    const response = await fetch(apiUrl, {
      method: "GET",
      headers,
      // Don't include a body for GET requests
    });

    // Get the response data
    const data = await response.json();

    // Return the response with appropriate status and headers
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(`Proxy error for GET /${path}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch data from API" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");

  try {
    const body = await request.json().catch(() => ({}));
    const apiUrl = `${API_BASE_URL}/${path}`;

    // Forward all headers except host
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers[key] = value;
      }
    });

    console.log(`Proxying POST request to ${apiUrl}`, {
      headers,
      body,
      path,
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    // Handle 204 No Content response specifically
    if (response.status === 204) {
      console.log(`Proxy response for ${path}: Status 204 No Content`);
      // For 204, there is no body. Return a simple NextResponse with the status.
      // Also, ensure any relevant headers from the original response are forwarded if needed,
      // though for a 204, there usually aren't many critical ones beyond what Next.js sets.
      // We can create an empty response with just the status.
      return new NextResponse(null, { status: 204 });
    }

    // For other statuses, attempt to parse JSON
    const data = await response.json().catch(() => ({
      error: `Failed to parse JSON response from API (status: ${response.status})`,
    }));

    console.log(`Proxy response for ${path}:`, {
      status: response.status,
      data,
    });

    // Return the response with appropriate status and headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(`Proxy error for POST /${path}:`, error);
    return NextResponse.json(
      {
        error: "Failed to send data to API",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Also handle PUT requests if needed by the application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");

  try {
    // Get the request body
    const body = await request.json().catch(() => ({}));

    // Forward the request to the actual API server
    const apiUrl = `${API_BASE_URL}/${path}`;

    // Get all headers from the original request
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      // Skip host header as it will be set automatically
      if (key.toLowerCase() !== "host") {
        headers[key] = value;
      }
    });

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await response.json().catch(() => ({}));

    // Return the response with appropriate status and headers
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(`Proxy error for PUT /${path}:`, error);
    return NextResponse.json(
      { error: "Failed to update data in API" },
      { status: 500 }
    );
  }
}

// Also handle DELETE requests if needed by the application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");

  try {
    // Forward the request to the actual API server
    const apiUrl = `${API_BASE_URL}/${path}`;

    // Get all headers from the original request
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      // Skip host header as it will be set automatically
      if (key.toLowerCase() !== "host") {
        headers[key] = value;
      }
    });

    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers,
    });

    // Get the response data
    const data = await response.json().catch(() => ({}));

    // Return the response with appropriate status and headers
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(`Proxy error for DELETE /${path}:`, error);
    return NextResponse.json(
      { error: "Failed to delete data in API" },
      { status: 500 }
    );
  }
}
