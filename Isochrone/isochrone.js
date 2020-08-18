importScripts('/latlng.js')

setup(async () => ({
    name: 'Isochrone',
    version: '1.0.3',
    description: 'Calculate isochrone'
}))

command('Isochrone', async () => {
    const layerId = await requestState('app.currentLayerId')

    const sourceId = await requestState(`layers.data.${layerId}.sourceId`)
    if(!sourceId){
        await notifyError('Source is not specified for current layer')
        return
    }

    const geometryType = await requestState(`sources.data.${sourceId}.geometryType`)
    if (geometryType !== 'Polygon') {
        await notifyError('Cannot create isochrone on non Polygon layer')
        return
    }

    const {lng, lat} = await requestPoint()
    const answer = await requestInput([
		['intervals', ['input', { label: 'Intervals', defaultValue: 5 }]],
		['radius',    ['input', { label: 'Radius', defaultValue: 1 }]],
		['cellSize',  ['input', { label: 'Cell Size', defaultValue: 0.05 }]],
		['profile',   ['input', { label: 'Profile', defaultValue: 'foot' }]],
        //['intervals', 5],
        //['radius', 1],
        //['cellSize', 0.05],
        //['profile', 'foot'],
    ], {
		title: 'Input isochrone parameters',
	})
    
    try {
        const url = `https://galton.urbica.co/api/${answer.profile}/`
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

