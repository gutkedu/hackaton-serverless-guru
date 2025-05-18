import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  "https://gz8ep2fj9g.execute-api.us-east-1.amazonaws.com/api";

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

    // Simplified header forwarding for diagnostics
    const forwardedHeaders: HeadersInit = {
      // Forward Content-Type from the original request, or default to application/json
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
    };
    // Specifically forward the Authorization header if it exists
    const authorizationHeader = request.headers.get('Authorization');
    if (authorizationHeader) {
      forwardedHeaders['Authorization'] = authorizationHeader;
    }
    // Log the headers being forwarded to the backend API for this path
    if (path === 'game/lobbies/return') {
      console.log(`Proxying POST to ${apiUrl} with headers:`, JSON.stringify(forwardedHeaders));
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: forwardedHeaders, // Use the explicitly constructed headers
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await response.json().catch(() => ({}));

    // Return the response with appropriate status and headers
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(`Proxy error for POST /${path}:`, error);
    return NextResponse.json(
      { error: "Failed to send data to API" },
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
