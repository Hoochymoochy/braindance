import { supabase } from "@/app/lib/utils/supabaseClient";

// 💥 Type for event input
type EventInput = {
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
};

// CREATE EVENT
export async function createEvent(hostId: string, body: EventInput) {
  const { error } = await supabase.from("events").insert({
    host_id: hostId,
    title: body.title,
    description: body.description,
    date: body.date,
    location: body.location,
    image_url: body.image,
  });

  if (error) throw new Error(error.message);
  return { success: true };
}

// GET ALL EVENTS BY HOST
export async function getEventsByHost(hostId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("host_id", hostId);

  if (error) throw new Error(error.message);
  return data;
}

// GET ALL PASSED EVENTS
export async function getPassedEvents(host: string) {
  const { data, error } = await supabase
    .from("passed_events")
    .select("*")
    .eq("host_id", host);
  
    if (error) throw new Error(error.message);
    return data;
}

// GET SINGLE EVENT
export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single(); // cleaner if expecting only one

  if (error) throw new Error(error.message);
  return data;
}

// UPDATE EVENT
export async function updateEvent(id: string, body: EventInput) {
  const { error } = await supabase
    .from("events")
    .update({
      title: body.title,
      description: body.description,
      date: body.date,
      location: body.location,
      image_url: body.image,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { success: true };
}

// DELETE EVENT
export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete event: ${error.message}`);
  return { success: true };
}

// GET ALL GLOBAL EVENTS
export async function getAllEvents() {
  const { data, error } = await supabase.from("events").select("*");

  if (error) throw new Error(error.message);
  return data;
}
