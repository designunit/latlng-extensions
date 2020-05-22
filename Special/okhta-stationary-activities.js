importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const LAYER_ID = '5ec84ba4b88b79b8806ec367'

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'okhta-stationary-activities',
        version: '0.0.0',
        description: 'okhta-stationary-activities',
        // options: {
        // 	layerId,
        // }
    }
})

on('install', async event => {
    overlay([
        ['@', 'right-center', [
            ['button', { icon: 'question', command: 'ShowHelp' }],
        ]],
    ])
})

on('idle', async event => {
    await toolbar([
        ['AddIdea', {
            label: 'Предложить идею',
            icon: 'bulb',
            color: '#FFD166',
        }],
    ], {
        foldedLabel: 'Добавить',
    })
})

on('feature.select', async event => {
    const featureId = event.data.featureId
    const layerId = event.data.layerId
    if (!featureId) {
        return
    }

    const fc = await requestFeatures([featureId])

    const feature = fc.features[0]
    const geometryType = feature.geometry.type
    assert(geometryType !== 'Point', new Error('Selected feature is not a point'))

    const type = feature.properties['type']
    const title = 'Активность'
    const comment = feature.properties['comment']

    const md = new markdownit()
    const raw = md.render([
        `# ${title}`,
        comment
    ].join('\n\n'));

    const tp = new Typograf({ locale: ['ru', 'en-US'] })
    const html = tp.execute(
        raw
    )

    await showMapPopup(feature.geometry.coordinates, ['html', {
        html, style: {
            padding: 16,
        }
    }])
})

command("AddIdea", async ctx => {
    return AddFeature()
})

command("ShowHelp", () => {
    showHelp()
})

async function showHelp() {
    const text = `
# Охта. Стационарные активности: 

## Статичные:
- стоят 
- сидят 

## Движение / спорт:
- решительно/целенаправленно идут транзитом
- прогуливаются 
- бегают / занимаются скандинавской ходьбой 
- занимаются др. спортом (уточните каким вручную) 
- катаются / проезжают на велосипеде/самокате/скейте/роликах 

## Занятия:
- выгуливают собаку 
- устраивают пикник 
- жарят шашлык
- кормят/наблюдают птиц 
- взаимодействуют с водой (трогают/кидают что-то и т.п.)
- рыбачат 
- катаются на лодке / каяке / сапе / катере
	`
    const md = new markdownit()
    const html = md.render(text)

    await showPopup([
        ['html', { html }]
    ], {
        title: 'Help',
        submit: 'Got it',
    })
}

async function AddFeature() {
    const mobile = await requestState('layout.mobile')
    const info = mobile
        ? 'Добавте точку на карте'
        : 'Добавте точку на карте'
    const info2 = mobile
        ? 'Наведите перекрестие и нажмите ОК'
        : 'Кликните по карте'
    const coord = await requestPoint(info2, info)

    const title = 'Активность'
    const form = await requestInput([
        // Статичные:
        ['static', ['select', { label: 'Статичные', }, [
            ['option', { value: 'Сидят' }],
            ['option', { value: 'Стоят' }],
        ]]],

        // Движение / спорт:
        ['static', ['select', { label: 'Движение / спорт', }, [
            ['option', { value: 'Решительно / целенаправленно идут транзитом' }],
            ['option', { value: 'Прогуливаются' }],
            ['option', { value: 'бегают / занимаются скандинавской ходьбой' }],
            ['option', { value: 'катаются / проезжают на велосипеде / самокате / скейте / роликах' }],
        ]]],

        // Движение / спорт:
        ['static', ['input', { label: 'Другой спорт', }]],

        // Занятия:
        ['static', ['select', { label: 'Занятия', }, [
            ['option', { value: 'Выгуливают собаку' }],
            ['option', { value: 'Устраивают пикник ' }],
            ['option', { value: 'Жарят шашлык' }],
            ['option', { value: 'Кормят / наблюдают птиц ' }],
            ['option', { value: 'Взаимодействуют с водой(трогают / кидают что - то и т.п.)' }],
            ['option', { value: 'Рыбачат' }],
            ['option', { value: 'Катаются на лодке / каяке / сапе / катере' }],
        ]]],

        // Количество
        ['groupSize', ['input', { label: 'Количество', }]],

        ['comment', ['text', {
            label: 'Комментарий',
            // placeholder: 'Описание',
            // required: 'Вы забыли оставить коментарий',
            rows: 4,
        }]],
    ], {
        title,
        submit: 'Добавить',
        cancel: 'Отмена',
    })

    const date = new Date()
    const properties = {
        ...form,
        dateAdded: date.toString(),
    }

    const f = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [coord.lng, coord.lat]
                },
                properties,
            }
        ]
    }

    await addFeatures(f, {
        layerId: LAYER_ID,
    })
}