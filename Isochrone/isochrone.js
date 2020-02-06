importScripts('/latlng.js')

console.log('NEW ISOCHRONE')

setup(async () => ({
    name: 'Isochrone',
    version: '1.0.2',
    description: 'Calculate isochrone'
}))

command('Isochrone', async () => {
    const layerId = await requestState('app.currentLayerId')
    const geometryType = await requestState(`layers.data.${layerId}.geometryType`)

    if (geometryType !== 'Polygon') {
        await notifyError('Cannot create isochrone on non Polygon layer')
        return
    }

    const {lng, lat} = await requestPoint()
    const answer = await requestInput([
        ['intervals', 5],
        ['radius', 1],
        ['cellSize', 0.05],
        ['profile', 'foot'],
    ])
    
    try {
        const url = `https://galton.urbica.co/api/${answer.profile}/`
        //const url = 'http://localhost:4000'
		console.log('WILL LOAD ISOCHRONE FROM', url)
        const res = await getJson(url, {
            intervals: answer.intervals,
            radius: answer.radius,
            cellSize: answer.cellSize,
            lat,
            lng,
        })

        await addFeatures(res)
    } catch (error) {
        console.error('Worker error', error)
        await notifyError('Something went wrong. Failed to calculate isochrone')
    }
})

