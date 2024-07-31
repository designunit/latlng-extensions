importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const SOURCE_ID = '66a989ad8d63e8000821dcc8'

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'app',
        version: '0.0.0',
        description: 'app',
        // options: {
        // 	layerId,
        // }
    }
})

on('install', async event => {
    // overlay([
    //     ['@', 'right-center', [
    //         ['button', { icon: 'question', command: 'ShowHelp' }],
    //     ]],
    // ])
})

on('idle', async event => {
    await toolbar([
        ['AddIdea', {
            icon: 'plus',
            label: 'Добавить',
            //color: '#FFD166',
        }],
    ], {
        //foldedLabel: 'Добавить',
    })
})

on('feature.select', async event => {
    return
    const featureId = event.data.featureId
    const layerId = event.data.layerId
    if (!featureId) {
        return
    }

    const fc = await requestFeatures([featureId])

    const feature = fc.features[0]
    const geometryType = feature.geometry.type
    assert(geometryType !== 'Point', new Error('Selected feature is not a point'))

    const title = 'Активность'
    const static = feature.properties['static']
    const moving = feature.properties['moving']
    const groupSize = feature.properties['groupSize']
    const comment = feature.properties['comment']
    const male = feature.properties['male']
    const female = feature.properties['female']
    const child = feature.properties['child']

    const md = new markdownit()
    const raw = md.render([
        `# ${title}`,
        comment
    ].join('\n\n'));

    const tp = new Typograf({ locale: ['ru', 'en-US'] })
    const html = tp.execute(
        raw
    )

    function getValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ')
        }

        return value
    }

    await showMapPopup(feature.geometry.coordinates, ['kv', {
        data: [
            { key: 'Количество', value: groupSize },
            { key: 'М', value: getValue(male) },
            { key: 'Ж', value: getValue(female) },
            { key: 'Ребенок', value: getValue(child) },

            { key: 'Занятия', value: getValue(static) },
            { key: 'Движение', value: getValue(moving) },

            { key: 'Комментарий', value: comment },
        ].filter(({ value }) => Boolean(value))
    }])

    // await showMapPopup(feature.geometry.coordinates, ['html', {
    //     html, style: {
    //         padding: 16,
    //     }
    // }])
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

    const title = 'Технический анализ'
    const form = await requestInput([
        ['q1', ['number', { min: -2, max: 2, label: 'Общее состояние фасадов' }]],
        ['q2', ['number', { min: -2, max: 2, label: 'Общее состояние элементов фасадов' }]],
        ['q3', ['number', { min: -2, max: 2, label: 'Общее состояние территории' }]],
        ['q4', ['number', { min: -2, max: 2, label: 'Покрытие (ямы, волны, разрушения, сколы, следы ремонта)' }]],
        ['q5', ['number', { min: -2, max: 2, label: 'Оборудование (состояние элементов)' }]],
        ['q6', ['number', { min: -2, max: 2, label: 'Ограждения (перекошенность, ржавчина, вмятины, сколы, оголенность закладных)' }]],
        ['q7', ['number', { min: -2, max: 2, label: 'Освещение (перекошенность, ржавчина, вмятины, сколы, оголенность закладных)' }]],
        ['q8', ['number', { min: -2, max: 2, label: 'Озеленение (открытый грунт, болезни деревьев)' }]],
        ['q9', ['number', { min: -2, max: 2, label: 'Отвод воды (наличие работающей ливневой канализации)' }]],
        ['q10', ['number', { min: -2, max: 2, label: 'Актуальность представленного функционала' }]],
        ['q11', ['number', { min: -2, max: 2, label: 'Моральное состояние' }]],
        ['q12', ['number', { min: -2, max: 2, label: 'Общее ощущение' }]],
        // ['q13', ['number', { label: '' }]],
        // ['q14', ['number', { label: '' }]],
        // ['q15', ['number', { label: '' }]],
        // ['q16', ['number', { label: '' }]],

        // Дополнительный критерий №1
        // Дополнительный критерий №2
        // Дополнительный критерий №3
        // Микроклиматический комфорт пребывания на территории (жарко, душно, влажно, холодно, ветренно, свежо, ощущается холоднее или ощущается теплее)
        // Состояние элементов городской среды работающей с климатическими особенностями (навесы, защита от ветра, защита от пыли, защита от сели?)
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
        sourceId: SOURCE_ID,
    })
}
