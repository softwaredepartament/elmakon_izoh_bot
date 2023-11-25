require('dotenv').config({path: require('path').join(__dirname, '../.env')})

const TelegramBot = require('node-telegram-bot-api');
const { uniqRow } = require('./lib/pg.js')
const express = require('express')

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
})
const app = express()

app.use(express.json())

function validation(req, res, next) {
    if (!req.body.login) {
        res.json({err: 'err', msg: 'login'})
    } else if (req.body.login !== 'pok4747zzzz') {
        res.json({err: 'err', msg: 'login'})
    } else if (!req.body.password) {
        res.json({err: 'err', msg: 'password'})
    } else if (req.body.password !== '987654345t6yhuj') {
        res.json({err: 'err', msg: 'password'})
    } else if (!req.body.branch_id) {
        res.json({err: 'err', msg: 'branch_id'})
    } else if (!req.body.client_id) {
        res.json({err: 'err', msg: 'client_id'})
    } else if (!req.body.branch_name) {
        res.json({err: 'err', msg: 'branch_name'})
    } else if (!req.body.contract_id) {
        res.json({err: 'err', msg: 'contract_id'})
    } else if (!req.body.client_full_name) {
        res.json({err: 'err', msg: 'client_full_name'})
    } else if (!req.body.client_birth_date) {
        res.json({err: 'err', msg: 'client_birth_date'})
    } else if (!req.body.contract_date) {
        res.json({err: 'err', msg: 'contract_date'})
    } else {
        next()
    }
}

function validationComment(req, res, next) {
    
    if (!req.body.login) {
        res.json({err: 'err'})
    } else if (req.body.login !== 'pok4747zzzz') {
        res.json({err: 'err'})
    } else if (!req.body.password) {
        res.json({err: 'err'})
    } else if (req.body.password !== '987654345t6yhuj') {
        res.json({err: 'err'})
    } else if (!req.body.id) {
        res.json({err: 'err'})
    } else if (!req.body.section_name) {
        res.json({err: 'err'})
    } else if (!req.body.contract_id) {
        res.json({err: 'err'})
    } else if (!req.body.payment_date) {
        res.json({err: 'err'})
    } else if (!req.body.summa) {
        res.json({err: 'err'})
    } else {
        next()
    }
}

bot.on('message', async message => {
    if (message.chat.id == process.env.BOT_GROUPID) {
        
        await uniqRow('insert into reply_message (reply_tg_msg_group_id, reply_tg_msg_chanel_id, reply_tg_msg_text) values ($1, $2, $3)', message.message_id, message.forward_from_message_id, message.text)
        
        const query = `
        select
        *
        from contract as c
        left join client as cli on cli.client_id = c.client_id
        where c.contract_c_id = $1 and cli.client_full_name = $2
        `
        const findContract = await uniqRow(query, message.text.split('📄')[1].split('\n')[0].substring(1), message.text.split('\n')[3]).then(data => data.rows[0])
        if (findContract) {
            await uniqRow('update contract set contract_msg_group_tg_id = $1 where contract_id = $2', message.message_id, findContract.contract_id)
            
            const queryProducts = `
            select
            *
            from contract_product as cp
            left join product as p on p.product_id = cp.product_id
            left join contract as c on c.contract_id = cp.contract_id
            where c.contract_c_id = $1
            `
            const products = await uniqRow(queryProducts, message.text.split('📄')[1].split('\n')[0].substring(1)).then(data => data.rows)
            let sendProductToGroupMSG = `#Mahsulot\n\n📄 ${message.text.split('📄')[1].split('\n')[0].substring(1)}\n\n`
            for (const product of products) {
                // console.log(product);
                sendProductToGroupMSG = sendProductToGroupMSG + `✅ ${product.product_name} - ${product.contract_product_count}\n`
            }
            await bot.sendMessage(process.env.BOT_GROUPID, sendProductToGroupMSG.substring(0, sendProductToGroupMSG.length - 1), {
                reply_to_message_id: message.message_id
            })
        }
    }
});

let count = 0

app.post('/api/sendcontract', validation, async (req, res) => {
    try {
        count += 1
        // console.log(req.body);
        let dbContract = await uniqRow('select * from contract where contract_c_id = $1', req.body.contract_id).then(data => data.rows[0])
        if (dbContract) {
            return res.send('bunday shartnoma mavjud')
        }
        
        let dbBranch = await uniqRow('select * from branch where branch_c_id = $1', req.body.branch_id).then(data => data.rows[0])
        if (!dbBranch) {
            dbBranch = await uniqRow('insert into branch(branch_name, branch_c_id) values ($1, $2) returning *', req.body.branch_name, req.body.branch_id).then(data => data.rows[0])
        }
        
        let dbClient = await uniqRow('select * from client where client_c_id = $1', req.body.client_id).then(data => data.rows[0])
        if (!dbClient) {
            dbClient = await uniqRow('insert into client(client_full_name, client_birth_date, client_c_id) values ($1, $2, $3) returning *', req.body.client_full_name, req.body.client_birth_date, req.body.client_id).then(data => data.rows[0])
        }

        res.json({status: 200})
        
        const message = `🏪 ${dbBranch.branch_name}\n\n📄 ${req.body.contract_id}\n${dbClient.client_full_name}\n👤 ${dbClient.client_birth_date}\n📅 ${req.body.contract_date}`
        const sendedMessage = await bot.sendMessage(process.env.BOT_CHANELID, message, {
            parse_mode: 'Markdown'
        })
        
        const createdContract = await uniqRow('insert into contract(contract_c_id, contract_created_date, contract_msg_chanel_tg_id, client_id, branch_id) values ($1,$2,$3,$4,$5) returning *', req.body.contract_id, req.body.contract_date, (await sendedMessage).message_id, dbClient.client_id, dbBranch.branch_id).then(data => data.rows[0])
        
        for (const product of req.body.products) {
            const checkProductIfExists = await uniqRow('select * from product where product_c_id = $1', product.product_id).then(data => data.rows[0])
            let createdProduct
            if (!checkProductIfExists) {
                createdProduct = await uniqRow('insert into product(product_c_id, product_name) values ($1, $2) returning *', product.product_id, product.product_name).then(data => data.rows[0])
            }

            console.log(createdProduct ? createdProduct.product_id : checkProductIfExists.product_id, + '   ', product);
            const checkContractProductIfExists = await uniqRow('select * from contract_product where product_id = $1', createdProduct ? createdProduct.product_id : checkProductIfExists.product_id).then(data => data.rows[0])
            if (!checkContractProductIfExists) {
                await uniqRow('insert into contract_product (product_id, contract_id, contract_product_count) values ($1, $2, $3)', createdProduct ? createdProduct.product_id : checkProductIfExists.product_id, createdContract.contract_id, product.product_count)
            }
        }

        console.log(count);
        
    } catch (error) {
        console.log(error);
    }
})

app.post('/api/sendcomment', validationComment, async (req, res) => {
    try {
        
        // {
        //     id: 'dec09361-6aa7-11ee-937c-7cb59b58fece',
        //     client_id: 'cc0dd8a8-289a-11eb-90fd-000c29d1a2f4',
        //     section_id: 'baf89925-93ee-11e9-80bd-18d6c70265c2',
        //     section_name: 'Отдел Рассрочки',
        //     contract_id: 'E030200823',
        //     client_full_name: "BOBQULOV ALISHER NASIDIN O'G'LI",
        //     payment_date: '14.10.2023',
        //     login: 'pok4747zzzz',
        //     password: '987654345t6yhuj',
        //     summa: '15000'
        //   }
        
        let dbContract = await uniqRow('select * from contract where contract_c_id = $1', req.body.contract_id).then(data => data.rows[0])
        if (!dbContract) {
            return res.send('bunday shartnoma mavjud emas')
        }
        
        let dbSection = await uniqRow('select * from section where section_c_id = $1', req.body.section_id).then(data => data.rows[0])
        if (!dbSection) {
            dbSection = await uniqRow('insert into section(section_name, section_c_id) values ($1, $2) returning *', req.body.section_name, req.body.section_id).then(data => data.rows[0])
        }
        
        const message = `✅ Тест️овый вариант\n\n${req.body.summa}`
        const sendedMessage = await bot.sendMessage(process.env.BOT_GROUPID, message, {
            reply_to_message_id: dbContract.contract_msg_group_tg_id,
            parse_mode: 'Markdown'
        })
        
        // if ((await sendedMessage).message_id) {
        //     await uniqRow('insert into contract(contract_c_id, contract_created_date, contract_msg_tg_id, client_id, branch_id) values ($1,$2,$3,$4,$5)', req.body.contract_id, req.body.contract_date, (await sendedMessage).message_id, dbClient.client_id, dbBranch.branch_id)
        // }
        
        res.json({status: 200})
    } catch (error) {
        console.log(error);
    }
})

app.listen(10000, console.log('10000'))