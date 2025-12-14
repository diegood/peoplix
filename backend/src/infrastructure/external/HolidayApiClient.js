export class HolidayApiClient {
    async fetchPublicHolidays(year, countryCode, regionCode) {
        if (!year || !countryCode) throw new Error("Year and CountryCode are required arguments.");

        // Nager.Date API
        const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
        
        try {
            const response = await fetch(url)
            if (!response.ok) {
                 const text = await response.text();
                 throw new Error(`API Error: ${response.status} ${response.statusText} - ${text}`);
            }
            
            let data = await response.json()
            
            // Filter by region if provided
            if (regionCode) {
                 const rc = regionCode.toUpperCase();
                 data = data.filter(h => {
                     // Global holidays (counties is null)
                     if (!h.counties) return true;
                     // Or specific region
                     return h.counties.some(c => c.endsWith(rc) || c === rc)
                 })
            }
            
            return data.map(h => ({
                date: h.date,
                localName: h.localName,
                name: h.name,
                countryCode: h.countryCode
            }))
        } catch (e) {
            console.error("Error fetching holidays:", e)
            throw new Error(`Failed to fetch public holidays from ${url}: ${e.message}`)
        }
    }
}
