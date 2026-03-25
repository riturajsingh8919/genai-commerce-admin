import { getGlobalSettings, updateGlobalSettings } from "@/lib/db/settings";

export async function GET() {
  try {
    const settings = await getGlobalSettings();
    return Response.json(settings);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const settings = await updateGlobalSettings(body);
    return Response.json(settings);
  } catch (error) {
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
