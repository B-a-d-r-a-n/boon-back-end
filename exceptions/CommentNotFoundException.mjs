import NotFoundException from "./NotFoundException.mjs";
class CommentNotFoundException extends NotFoundException {
  constructor(id) {
    super(`Comment with id ${id} wasn't found`);
  }
}
export default CommentNotFoundException;