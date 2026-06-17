import moment from "moment";

const getMedicationOccurrences = (medication: any) => {
    const startDateTime = moment(`${medication?.startDate} ${medication?.startTime}`, "YYYY-MM-DD HH:mm");
    const lastUseDateTime = medication?.lastUse ? moment(medication.lastUse, "YYYY-MM-DD HH:mm") : null;
    const durationDays = Number(medication?.duration || 0);
    const recurrence = Number(medication?.periodicity?.recurrency || 0);
    const unit = medication?.periodicity?.unit;

    if (!startDateTime.isValid() || !durationDays || !recurrence || !unit) {
        return [];
    }

    const endDateTime = moment(medication.startDate, "YYYY-MM-DD").add(durationDays, "days").endOf("day");
    const occurrences: moment.Moment[] = [];

    let currentOccurrence = (lastUseDateTime?.isValid() ? lastUseDateTime : startDateTime).clone();

    if (lastUseDateTime?.isValid() && currentOccurrence.isBefore(startDateTime)) {
        currentOccurrence = startDateTime.clone();
    }

    while (currentOccurrence.isSameOrBefore(endDateTime)) {
        occurrences.push(currentOccurrence.clone());
        currentOccurrence = currentOccurrence.add(recurrence, unit);
    }

    return occurrences;
};

const getNextMedication = (storedMedications: any[]) => {
    const now = moment();
    const upcomingOccurrences = storedMedications.flatMap((medication) =>
        getMedicationOccurrences(medication)
            .filter((occurrence) => occurrence.isSameOrAfter(now))
            .map((occurrence) => ({ medication, occurrence }))
    );

    if (upcomingOccurrences.length === 0) {
        return null;
    }

    upcomingOccurrences.sort((a, b) => a.occurrence.valueOf() - b.occurrence.valueOf());

    return upcomingOccurrences[0];
};

export default getNextMedication;