process.env.NODE_ENV === "test"

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let book_isbn;

beforeEach(async()=>{
    const book = await db.query(`
    INSERT INTO books (isbn,amazon_url,author,language,pages,publisher,title,year) 
    VALUES ('123432122', 
    'https://amazon.com/taco', 
    'Elie', 
    'English', 
    100,  
    'Nothing publishers', 
    'my first book', 2008) 
    RETURNING isbn`)

    book_isbn = book.rows[0].isbn
})

afterEach(async()=>{
    await db.query('DELETE FROM books')
})

afterAll(async()=>{
    await db.end()
})

describe('GET /', ()=>{
    test('Get all books', async()=>{
        const res = await request(app).get('/books')
        expect(res.statusCode).toBe(200)
        expect(res.body.books[0]).toHaveProperty("isbn")
    })
})

describe('POST /', ()=>{
    test('create a new book listing', async()=>{
        const res = await request(app).post('/books').send({
            "isbn": "0691161518",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        })
        expect(res.statusCode).toBe(201)
        expect(res.body.book).toHaveProperty("isbn") // req.body.book is from created object on res.json
    })
    test('Restriction from JSON validation', async()=>{
        const res = await request(app).post('/books').send({"author": "Lengua"})
        expect(res.statusCode).toBe(400)
    })
})

describe('GET /:isbn', ()=>{
    test('get single book', async()=>{
        const res = await request(app).get(`/books/${book_isbn}`)
        expect(res.statusCode).toBe(200)
        expect(res.body.book.isbn).toEqual(book_isbn)
    })
    test('error if not found isbn', async()=>{
        const res = await request(app).get(`/books/239814124`)
        expect(res.statusCode).toBe(404)
    })
})

describe('PUT /:isbn', ()=>{
    test('Update a book', async()=>{
        const res = await request(app).put(`/books/${book_isbn}`).send({
        "isbn": "239529111", //I made it so you have to input isbn but does not return/update it
        "amazon_url": "http://a.co/eobPtX2",
        "author": "Matthew Lane",
        "language": "Engrish",
        "pages": 268,
        "publisher": "Princeton University Press",
        "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
        "year": 2017})
        expect(res.statusCode).toBe(200)
    })
    test('Restricted validation request',async()=>{
        const res = await request(app).put(`/books/${book_isbn}`).send({
            "isbn": 11111, 
            "amazon_url": 44444,
            "author": 1111,
            "language": "Engrish",
            "pages": 26812,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 20127})
            expect(res.statusCode).toBe(400)
    })
})

describe("DELETE /books/:id", async function () {
    test("Deletes a single a book", async function () {
    const response = await request(app)
        .delete(`/books/${book_isbn}`)
    expect(response.body).toEqual({message: "Book deleted"});
    });
});