import NotFoundException from "./NotFoundException.mjs";
class BookNotFoundException extends NotFoundException {
  constructor(id) {
    super(`Book with id ${id} wasn't found`);
  }
}

export default BookNotFoundException;
