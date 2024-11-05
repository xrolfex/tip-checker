
/**
 * Fetches all operational locations for the Global Entry service.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of location objects.
 * @throws {Error} If the fetch request fails or the response cannot be parsed as JSON.
 */
const getAllLocations = async () => {
    const response = await fetch(" https://ttp.cbp.dhs.gov/schedulerapi/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=Global%20Entry");
    const data = await response.json();
    return data;
};

/**
 * Retrieves all location IDs that match the specified filter.
 *
 * @param {Array} locations - An array of location objects.
 * @param {Array} filter - An array of state strings to filter the locations by.
 * @returns {Array} - An array of location IDs that match the filter.
 */
const getAllLocationIds = (locations, filter) => {
    const filteredData = locations.filter((location) => filter.includes(location.state));
    const locationIds = filteredData.map((location) => location.id);
    return locationIds;
};

/**
 * Gets all available appointments from the TTP CBP API.
 * @param {number[]} localIds - An array of location ids you'd like to fetch appointments for.
 * @param {number} limit - The maximum amount of appointments you'd like to fetch for each location id.
 * @returns {Array} - Returns an array of available appointments.
 */
const getAvailableAppointments = async ({ locations, locationIds, limit }) => {
    const allAppointments = [];

    await Promise.all(
        locationIds.map(async (locationId) => {
            const response = await fetch(
                `https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=${limit}&locationId=${locationId}&minimum=1`
            );

            const data = await response.json();

            const availableAppointments = data.map((appointment) => {
                const location = locations.find(loc => loc.id === appointment.locationId);
                return {
                    location: location ? location.name : "Unknown", // Assuming locations have a 'name' property
                    start: new Date(appointment.startTimestamp).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                    }),
                    end: new Date(appointment.endTimestamp).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                    }),
                };
            });

            allAppointments.push(...availableAppointments);
        })
    );

    return allAppointments;
};

/**
 * Initializes the script.
 * @returns {void}
 */
const init = async () => {
    console.log("Checking for appointments...");

    const locations = await getAllLocations();

    const locationIds = getAllLocationIds(locations, ["OH", "KY", "IN", "IL", "TN"]);

    const appointments = await getAvailableAppointments({
        locations: locations,
        locationIds: locationIds,
        limit: 1,
    });

    if (appointments.length) {
        /** If you don't want to use Twilio, you can replace this part with your own notification system. */
        //appointments.map((appointment) => sendTextMessage(appointment));
        appointments
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .map((appointment) => {
                console.log(`There is a TTP appointment available at ${appointment.location} on ${appointment.start}!`)
            });
    } else {
        console.log("No appointments found.");
    }
};

console.clear();
console.log("Starting appointment checker...");
init();

/**
 * Runs the script every 5 minutes.
 */
// setInterval(init, 300000);
