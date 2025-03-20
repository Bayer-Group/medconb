import medconb.domain as d
import medconb.graphql.types as gql

from .base import BaseInteractor


class UpdateMe(BaseInteractor):
    def __call__(self, dto: gql.UpdateMeRequestDto) -> d.User:
        if dto.tutorial_state:
            self.user.tutorial_state = dto.tutorial_state

        return self.user
