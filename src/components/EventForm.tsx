import type { Event, Shift } from "@/lib/db";
import FormMemory from "@/components/FormMemory";
import { utcToZonedInputs } from "@/lib/time";

const MAX_SHIFTS = 5;

type Props = {
  tz: string;
  event?: Event;
  shifts?: Shift[];
  error?: string;
};

export default function EventForm({ tz, event, shifts = [], error }: Props) {
  const editing = Boolean(event);
  const day = event ? utcToZonedInputs(event.starts_at, tz).date : "";
  const rows = Array.from({ length: MAX_SHIFTS }, (_, i) => shifts[i]);

  return (
    <form id="event-form" action={editing ? `/app/api/events/${event!.id}` : "/app/api/events"} method="post" className="ap-form ap-form-wide">
      <input type="hidden" name="intent" value={editing ? "update" : "create"} />
      {error && <p className="ap-error ap-error-top">{decodeURIComponent(error)}</p>}
      <FormMemory formId="event-form" storageKey={editing ? `ck-event-${event!.id}` : "ck-event-new"} restore={Boolean(error)} />

      <div className="ap-card ap-form">
        <h2 className="ap-h2">Event</h2>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" type="text" required maxLength={120} defaultValue={event?.title} placeholder="Neighborhood garden day" />

        <div className="ap-grid-2">
          <div className="ap-form">
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" required defaultValue={day} />
          </div>
          <div className="ap-form">
            <label htmlFor="location">Location</label>
            <input id="location" name="location" type="text" maxLength={160} defaultValue={event?.location ?? ""} placeholder="Maple Street lot, 24800 Stonehill Dr" />
          </div>
        </div>

        {!editing && (
          <div className="ap-grid-2">
            <div className="ap-form">
              <label htmlFor="repeat">Repeats</label>
              <select id="repeat" name="repeat" defaultValue="none">
                <option value="none">Just this once</option>
                <option value="weekly">Every week</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Every month, same date</option>
              </select>
            </div>
            <div className="ap-form">
              <label htmlFor="repeat_more">How many more times <span>Up to 11, if it repeats</span></label>
              <input id="repeat_more" name="repeat_more" type="number" min={1} max={11} defaultValue={3} />
            </div>
          </div>
        )}
        {!editing && <p className="ap-muted">A repeating event is saved as separate events, one per date, each with its own sign-up link. You can change or cancel any one without touching the others.</p>}

        <label htmlFor="description">What volunteers should know <span>Optional</span></label>
        <textarea id="description" name="description" rows={3} maxLength={1000} defaultValue={event?.description ?? ""} placeholder="Wear closed-toe shoes. Water and gloves provided." />

        <label htmlFor="notes">Note for the morning-of reminder <span>Optional</span></label>
        <input id="notes" name="notes_for_volunteers" type="text" maxLength={200} defaultValue={event?.notes_for_volunteers ?? ""} placeholder="Park on Stonehill, not in the lot." />

        <fieldset className="ap-reminders">
          <legend>Automatic emails to volunteers</legend>
          <input type="hidden" name="reminders_present" value="1" />
          <label className="ap-check"><input type="checkbox" checked disabled readOnly /><span><strong>When they sign up</strong> A confirmation with the details. Always sent.</span></label>
          <label className="ap-check"><input type="checkbox" name="remind_day_before" defaultChecked={event?.remind_day_before !== false} /><span><strong>The day before</strong> A reminder that asks them to confirm they&apos;re coming.</span></label>
          <label className="ap-check"><input type="checkbox" name="remind_morning_of" defaultChecked={event?.remind_morning_of !== false} /><span><strong>The morning of</strong> A last reminder with your note above.</span></label>
        </fieldset>
      </div>

      <div className="ap-card ap-form">
        <h2 className="ap-h2">Shifts</h2>
        <p className="ap-muted">Up to five. Leave a row blank to skip it. Times are {tz.replace("_", " ")}.</p>
        <div className="ap-shift-rows">
          <div className="ap-shift-head"><span>Shift name</span><span>Starts</span><span>Ends</span><span>Spots</span></div>
          {rows.map((s, i) => {
            const st = s ? utcToZonedInputs(s.starts_at, tz).time : "";
            const en = s ? utcToZonedInputs(s.ends_at, tz).time : "";
            return (
              <div className="ap-shift-row" key={i}>
                {s && <input type="hidden" name={`shift_id_${i}`} value={s.id} />}
                <input aria-label={`Shift ${i + 1} name`} name={`shift_name_${i}`} type="text" maxLength={60} defaultValue={s?.name ?? ""} placeholder={i === 0 ? "Setup crew" : i === 1 ? "Main shift" : i === 2 ? "Cleanup" : ""} />
                <input aria-label={`Shift ${i + 1} start time`} name={`shift_start_${i}`} type="time" defaultValue={st} />
                <input aria-label={`Shift ${i + 1} end time`} name={`shift_end_${i}`} type="time" defaultValue={en} />
                <input aria-label={`Shift ${i + 1} spots`} name={`shift_capacity_${i}`} type="number" min={1} max={500} defaultValue={s?.capacity ?? 8} />
              </div>
            );
          })}
        </div>
        <p className="ap-muted">Removing a shift that already has sign-ups isn&apos;t possible here; cancel those sign-ups first from the event page.</p>
      </div>

      {error && <p className="ap-error">{decodeURIComponent(error)}</p>}
      <div className="ap-actions">
        <button className="ck-button" type="submit">{editing ? "Save changes" : "Create event"} <span aria-hidden="true">↗</span></button>
        <a className="ap-ghost" href={editing ? `/app/events/${event!.id}` : "/app/events"}>Cancel</a>
      </div>
    </form>
  );
}
