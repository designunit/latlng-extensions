importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const LAYER_ID = '60a98d169c63b40147d03ee0'
const PERMALINK = 'https://unit4.io'

const typeLabel = new Map([
    ['attraction', 'Ценность'],
    ['idea', 'Идея'],
    ['problem', 'Проблема'],
])
const buttonLabel = new Map([
    ['attraction', 'Описать ценность'],
    ['idea', 'Предложить идею'],
    ['problem', 'Описать проблему'],
])
const colors = new Map([
    ['attraction', '#4DCCBD'],
    ['idea', '#FFD166'],
    ['problem', '#F25C63'],
])

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'Test',
        version: '1.0.0',
        description: 'survey',
        // options: {
        // 	layerId,
        // }
    }
})

on('install', async event => {
    overlay([
        // ['@', 'top-left', [
        //     ['button', { icon: 'arrow-left', href: PERMALINK }],
        //     // ['html', {
        //     //     html: '<a style="background:white;padding:2px 5px;" href="https://берегурай.рф">← на сайт берегурай.рф</a>',
        //     // }],
        // ]],
        // ['@', 'top-center', [
        //     ['html', { html: '<h1 style="margin:0;">ПИТКЯРАНТА</h1>' }],
        // ]],
        ['@', 'right-center', [
            ['button', { icon: 'question', command: 'ShowHelp' }],
        ]],
    ])

    showHelp()
})

on('idle', async event => {
    const uid = await getUserId()
    if(!uid){
        console.log('User is not authorized: do not show buttons')
        return
    }

    await toolbar([
        ['AddIdea', {
            label: buttonLabel.get('idea'),
            icon: 'bulb',
            color: colors.get('idea'),
        }],
        ['AddAttraction', {
            label: buttonLabel.get('attraction'),
            icon: 'like',
            color: colors.get('attraction'),
        }],
        ['AddProblem', {
            label: buttonLabel.get('problem'),
            icon: 'dislike',
            color: colors.get('problem'),
        }],
    ], {
        foldedLabel: 'Добавить',
    })
})

function mdToHtml(text) {
    const md = new markdownit()
    const tp = new Typograf({ locale: ['ru', 'en-US'] })
    const raw = md.render(text)
    return tp.execute(raw)
}

function getFeaturePopupContent(feature) {
    const name = feature.properties['Name']
    if(name){
        return mdToHtml(`## ${name}`)
    }

    const type = feature.properties['type']
    if(!type){
        return null
    }

    const title = typeLabel.get(type)
    const comment = feature.properties['comment']

    let user = feature.properties['user']
    if(!user) {
       user = 'unknown' 
    }

    let imgs = feature.properties['imgs']
    if (!imgs) {
        imgs = []
    }

    const imgRows = imgs.map(img => `<img src="${img.fileUrl}" width="100%"/>`)

    return mdToHtml([
        `## ${title}`,
        comment,

        `added by ${user}`,

        ...imgRows,
    ].join('\n\n'))
}

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

    const html = getFeaturePopupContent(feature)
    if(!html) {
        return
    }

    // const kv = [
    //     ['wood', 'Порода'],
    //     ['trunk_diameter', 'Обхват ствола на высоте 130 см (см)'],
    //     ['height', 'Высота (м)'],
    //     ['crown_diameter', 'Диаметр кроны (м)'],
    //     ['condition', 'Состояние'],
    //     ['trunk_support', 'Наличие опоры'],
    //     ['ground', 'Тип поверхности, в которое посажено дерево'],
    // ]
    // await showMapPopup(feature.geometry.coordinates, ['kv', {
    //     data: kv
    //         .map(([key, label]) => {
    //             let value = feature.properties[key]
    //             if (Array.isArray(value)) {
    //                 value = value[0]
    //             }
    //             return {
    //                 key: label, value,
    //             }
    //         })
    //         .filter(({ value }) => Boolean(value))
    // }])

    await showMapPopup(feature.geometry.coordinates, ['html', {
        html, style: {
            padding: 16,
        }
    }])
})

command("AddAttraction", async ctx => {
    return AddFeature({
        type: 'attraction',
        title: buttonLabel.get('attraction'),
        placeholder: 'Расскажите свою историю...',
        label: 'Комментарий',
        categories: [],
    })
})

command("AddIdea", async ctx => {
    return AddFeature({
        type: 'idea',
        title: buttonLabel.get('idea'),
        placeholder: 'Опишите свою идею...',
        label: 'Комментарий',
        categories: [],
    })
})

command("AddProblem", async ctx => {
    return AddFeature({
        type: 'problem',
        title: buttonLabel.get('problem'),
        placeholder: 'Опишите проблему...',
        label: 'Комментарий',
        categories: [],
    })
})

command("ShowHelp", () => {
    showHelp()
})

async function showHelp() {
    const html = mdToHtml(`
# test 
    `)
    await showPopup([
        ['html', { html }]
    ], {
        title: 'Help',
        submit: 'Got it',
    })
}

async function AddFeature({ type, title, placeholder, label, categories }) {
    const mobile = await requestState('layout.mobile')
    const info = mobile
        ? 'Добавте точку на карте'
        : 'Добавте точку на карте'
    const info2 = mobile
        ? 'Наведите перекрестие и нажмите ОК'
        : 'Кликните по карте'
    const coord = await requestPoint(info2, info)
    // const coord = await requestPoint('Кликни по карте', 'что-то произойдет')

    // const before = !categories ? [] : [
    //     ['category', ['select', { label: 'Категория' },
    //         categories.map(value => ['option', { value }])
    //     ]]
    // ]
    const form = await requestInput([
        ['comment', ['text', {
            label,
            placeholder,
            required: 'Вы забыли оставить коментарий',
            rows: 12,
        }]],
        ['imgs', ['image', {
            required: false,
            label: 'Images',
            multiple: true,
        }]],
    ], {
        title,
        submit: 'Добавить',
        cancel: 'Отмена',
    })

    console.log('input:', form)

    const user = await getUser()
    const date = new Date()
    const properties = {
        comment: form.comment,
        imgs: form.imgs,
        user: user.name,
        userId: user.id,
        userImage: user.image,
        // category: form.category,
        // contact: form.contact,
        dateAdded: date.toString(),
        type,
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

