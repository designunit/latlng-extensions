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
    const activity = feature.properties['activity']
    const moving = feature.properties['moving']
    const groupSize = feature.properties['groupSize']
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

    await showMapPopup(feature.geometry.coordinates, ['kv', {
        data: [
            { key: 'activity', value: activity },
            { key: 'moving', value: moving },
            { key: 'group size', value: groupSize },
            { key: 'comment', value: comment },
        ]
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

    const title = 'Активность'
    const form = await requestInput([
        // Количество
        ['groupSize', ['input', { label: 'Количество' }]],

        // "Пол": (у каждого пола вываливается простыня возраст):
        ['male', ['select', { label: 'М', mode: 'multiple' }, [
            ['option', { value: 'молодежь (18-30)' }],
            ['option', { value: 'взрослый (30-50)' }],
            ['option', { value: 'пенсионного возраста' }],
        ]]],
        ['female', ['select', { label: 'Ж', mode: 'multiple' }, [
            ['option', { value: 'молодежь (18-30)' }],
            ['option', { value: 'взрослый (30-50)' }],
            ['option', { value: 'пенсионного возраста' }],
        ]]],
        ['child', ['select', { label: 'Ребенок', mode: 'multiple' }, [
            ['option', { value: 'ребенок в коляске' }],
            ['option', { value: 'ребенок 1-2 лет' }],
            ['option', { value: 'ребенок дошкольного возраста (3-6)' }],
            ['option', { value: 'ребенок младшего/среднего школьного (7-13)' }],
            ['option', { value: 'подростки (14-18)' }],
        ]]],

        // Занятия:
        ['static', ['select', { label: 'Статические активности', mode: 'tags' }, [
            ['option', { value: 'стоят' }],
            ['option', { value: 'сидят' }],
            ['option', { value: 'разговаривают' }],
            ['option', { value: 'любуются' }],
            ['option', { value: 'выпивают' }],
            ['option', { value: 'курят' }],
            ['option', { value: 'читают' }],
            ['option', { value: 'слушают музыку группой' }],
            ['option', { value: 'устраивают пикник' }],
            ['option', { value: 'жарят шашлык' }],
            ['option', { value: 'кормят птиц' }],
            ['option', { value: 'наблюдают за птицами' }],
            ['option', { value: 'взаимодействуют с водой' }],
            ['option', { value: 'рыбачат' }],
            ['option', { value: 'спорт' }],
            ['option', { value: 'фотографируют/ся' }],
            ['option', { value: 'справляют нужду' }],
            ['option', { value: 'чинят машину' }],
        ]]],

        // Движение / спорт:
        ['moving', ['select', { label: 'Динамические активности', mode: 'tags' }, [
            ['option', { value: 'идут транзитом' }],
            ['option', { value: 'идут прогуливаются' }],
            ['option', { value: 'идут домой' }],
            ['option', { value: 'идут выбросить мусор' }],
            ['option', { value: 'гуляют' }],
            ['option', { value: 'бег' }],
            ['option', { value: 'с собакой' }],
            ['option', { value: 'с ребенком (ребенок пешком)' }],
            ['option', { value: 'с коляской' }],
            ['option', { value: 'катаются' }],
            ['option', { value: 'велосипед' }],
            ['option', { value: 'самокат' }],
            ['option', { value: 'скейт, роликах' }],
            ['option', { value: 'ролики' }],
            ['option', { value: 'катаются на лодке' }],
            ['option', { value: 'катаются на каяке' }],
            ['option', { value: 'катаются на сапе' }],
            ['option', { value: 'катаются на катере' }],
            ['option', { value: 'скандинавская ходьба' }],
            ['option', { value: 'собирают цветы' }],
        ]]],

        // Day
        ['day', ['select', { label: 'День недели' }, [
            ['option', { value: 'будний' }],
            ['option', { value: 'выходной' }],
        ]]],

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
