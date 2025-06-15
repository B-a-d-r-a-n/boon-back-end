import NotFoundException from "./NotFoundException.mjs";
class UserNotFoundException extends NotFoundException {
  constructor(id) {
    super(`User with id ${id} wasn't found`);
  }
}

export default UserNotFoundException;
