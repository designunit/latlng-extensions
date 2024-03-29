importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const SOURCE_ID = '6319f1cf08e2250009dc5177'

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'vrn-stationary-activities',
        version: '0.0.0',
        description: 'vrn-stationary-activities',
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
    const uid = await getUserId()
    if(!uid){
        console.log('User is not authorized: do not show buttons')
        return
    }

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
    const groupSize = feature.properties['groupSize']
    const comment = feature.properties['comment']
    const male = feature.properties['male']
    const female = feature.properties['female']
    const child = feature.properties['child']
    const dateAdded = feature.properties['dateAdded']

    const d = (n) => String(n).length === 1 ? `0${n}` : `${n}`
    const date = new Date(dateAdded)
    const day = [date.getDay(), date.getMonth(), date.getFullYear()]
      .map(d)
      .join('.')
    const time = [date.getHours(), date.getMinutes()]
      .map(d)
      .join(':')

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
            { key: 'Занятия', value: getValue(activity) },
            { key: 'Дата', value: day },
            { key: 'Время', value: time },

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
# Бульвар Карла Маркса. Стационарные активности:

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
            ['option', { value: 'пенсионер' }],
        ]]],
        ['female', ['select', { label: 'Ж', mode: 'multiple' }, [
            ['option', { value: 'молодежь (18-30)' }],
            ['option', { value: 'взрослый (30-50)' }],
            ['option', { value: 'пенсионер' }],
        ]]],
        ['child', ['select', { label: 'Ребенок', mode: 'multiple' }, [
            ['option', { value: 'ребенок (1-2)' }],
            ['option', { value: 'ребенок дошкольного возраста (3-6)' }],
            ['option', { value: 'ребенок школьного возраста (7-13)' }],
            ['option', { value: 'подросток (14-18)' }],
        ]]],

        // Занятия:
        ['activity', ['select', { label: 'Активности', mode: 'tags' }, [
            ['option', { value: 'стоят' }],
            ['option', { value: 'сидят' }],
            ['option', { value: 'разговаривают' }],
            ['option', { value: 'едят' }],
            ['option', { value: 'выпивают' }],
            ['option', { value: 'курят' }],
            ['option', { value: 'читают' }],
            ['option', { value: 'транзит' }],
            ['option', { value: 'поют' }],
            ['option', { value: 'продают' }],
            ['option', { value: 'прогулка' }],
            ['option', { value: 'бег' }],
            ['option', { value: 'велосипед/самокат' }],
            ['option', { value: 'скейт/ролики' }],
            ['option', { value: 'фотографируют/ся' }],
            ['option', { value: 'с собакой' }],
            ['option', { value: 'с коляской' }],
            ['option', { value: 'слушают музыку' }],
            ['option', { value: 'кормят птиц' }],
        ]]],

        // Day
        // ['day', ['select', { label: 'День недели' }, [
        //     ['option', { value: 'будний' }],
        //     ['option', { value: 'выходной' }],
        // ]]],

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
    const day = date.getDay()
    const hours = date.getHours()
    const user = await getUser()

    const properties = {
        ...form,
        user: user.name,
        uid: user.id,
        dateAdded: date.toString(),
        day,
        hours,
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
