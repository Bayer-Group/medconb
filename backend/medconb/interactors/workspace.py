from typing import Sequence, cast

import medconb.domain as d
import medconb.graphql.types as gql

from .base import BaseInteractor, CollectionNotExistsException
from .codelist import DeleteCodelist
from .phenotype import DeletePhenotype


class CollectionInteractor(BaseInteractor):  # noqa R901 - too complex
    ...


class WorkspaceCollections(BaseInteractor):
    def set_parent(self, obj: d.Workspace) -> None:
        self.workspace = obj

    def __call__(self, dto: gql.CollectionListParametersDto) -> list[d.Collection]:
        res = self.collection_repository.get_all(self.workspace.collection_ids)
        res.sort(key=lambda x: self.workspace.collection_ids.index(x.id))

        if dto.item_type is None:
            return res

        return [c for c in res if c.item_type == dto.item_type]


class MoveCollection(BaseInteractor):
    def __call__(self, dto: gql.MoveCollectionRequestDto) -> bool:
        if dto.collection_id == dto.ref_collection_id:
            return True

        try:
            self.workspace.move_collection_after(
                dto.collection_id, dto.ref_collection_id
            )
        except d.CollectionNotInWorkspaceException as e:
            raise CollectionNotExistsException(e.collection_id)

        return True


class CreateCollection(CollectionInteractor):
    def __call__(self, dto: gql.CreateCollectionRequestDto) -> d.Collection:
        all_props = self.session.property_repository.get_all(d.PropertyClass.Collection)
        obj_properties = d.init_property_bag(
            all_props=all_props, current_user_id=self.user.id
        )
        d.update_property_bag(
            property_bag=obj_properties,
            input_=dto.properties,
            all_props=all_props,
            current_user_id=self.user.id,
        )

        collection = d.Collection(
            id=self.collection_repository.new_id(),
            name=dto.name,
            item_type=dto.item_type,
            item_ids=[],
            description=dto.description or "",
            properties=obj_properties,
            reference_id=dto.reference_id,
            _owner_id=self.user.id,
        )

        self.session.add(collection)
        self.workspace.add_collection(collection.id)
        return collection


class UpdateCollection(CollectionInteractor):  # noqa R901 - too complex
    def __call__(  # noqa R901 - too complex
        self, dto: gql.UpdateCollectionRequestDto
    ) -> d.Collection:
        if not self.workspace.contains_collection(dto.collection_id):
            raise CollectionNotExistsException(dto.collection_id)

        collection = self.collection_repository.get(dto.collection_id)
        prop_repo = self.session.property_repository
        all_props = prop_repo.get_all(d.PropertyClass.Collection)
        all_props_by_name = {p.name: p for p in all_props}

        if collection is None:
            raise CollectionNotExistsException(dto.collection_id)

        if collection.locked:
            raise ValueError(
                f"Collection {collection.id} is locked and cannot be updated"
            )

        if dto.name is not None:
            collection.name = dto.name

        if dto.description is not None:
            collection.description = dto.description

        if dto.properties is not None:
            d.update_property_bag(
                property_bag=collection.properties,
                input_=dto.properties,
                all_props=all_props,
                current_user_id=self.user.id,
            )

        if dto.reference_id is not None:
            collection.reference_id = dto.reference_id

        if dto.owner_id is not None:
            new_owner = self.user_repository.get(dto.owner_id)
            if not new_owner:
                raise ValueError("The new owner does not exist")

            d.transfer_ownership(collection, self.user, new_owner)

        if dto.locked is not None:
            collection.locked = dto.locked

        d.set_auto_generated_props(
            collection.properties, self.user.id, all_props_by_name
        )

        return collection


class DeleteCollection(BaseInteractor):
    def __call__(self, dto: gql.DeleteCollectionRequestDto) -> bool:
        if not self.workspace.contains_collection(dto.collection_id):
            raise CollectionNotExistsException(dto.collection_id)

        collection = self.collection_repository.get(dto.collection_id)
        if collection is None:
            raise CollectionNotExistsException(dto.collection_id)

        if collection.locked:
            raise ValueError(
                f"Collection {collection.id} is locked and cannot be deleted"
            )

        items: Sequence[d.Phenotype | d.Codelist]
        match collection.item_type:
            case d.ItemType.Codelist:
                items = self.session.codelist_repository.get_all(collection.item_ids)
                for codelist in items:
                    DeleteCodelist(self.session, self.user)(
                        gql.DeleteCodelistRequestDto(codelist_id=codelist.id)
                    )
            case d.ItemType.Phenotype:
                items = self.session.phenotype_repository.get_all(collection.item_ids)
                for phenotype in items:
                    DeletePhenotype(self.session, self.user)(
                        gql.DeletePhenotypeRequestDto(phenotype_id=phenotype.id)
                    )

        self.workspace.remove_collection(dto.collection_id)
        self.session.delete(collection)

        return True


class SetCollectionPermissions(BaseInteractor):
    """
    Set the permissions of a Collection from your workspace.
    """

    def __call__(self, dto: gql.SetCollectionPermissionsRequestDto) -> bool:
        if not self.workspace.contains_collection(dto.collection_id):
            raise CollectionNotExistsException(dto.collection_id)

        users = self.user_repository.get_all(dto.reader_ids, include_system=True)

        collection = self.collection_repository.get(dto.collection_id)
        assert collection is not None
        collection.set_readers(users)

        return True


class ResolveContainerItemContainerHierarchy(BaseInteractor):
    def set_parent(self, obj: d.Phenotype | d.Codelist) -> None:
        self.container_item = obj

    def __call__(self) -> list[d.ContainerSpec]:
        return self.build_hierarchy(self.container_item)

    def build_hierarchy(
        self,
        current_item: d.Collection | d.Phenotype | d.Codelist,
        hierarchy: list[d.ContainerSpec] = [],
    ) -> list[d.ContainerSpec]:
        if isinstance(current_item, d.Collection):
            return hierarchy

        assert isinstance(current_item, d.Phenotype | d.Codelist)
        return self.build_hierarchy(
            cast(
                d.Collection | d.Phenotype,
                self._must_load_container(current_item.container.id),
            ),
            [current_item.container] + hierarchy,
        )


class ResolveContainerItemOwnerID(BaseInteractor):
    def set_parent(self, obj: d.Phenotype | d.Codelist) -> None:
        self.container_item = obj

    def __call__(self) -> d.UserID:
        root_collection = self._must_load_root_collection_of(self.container_item)
        return root_collection.owner_id


class ResolveContainerSpecName(BaseInteractor):
    def set_parent(self, obj: d.ContainerSpec) -> None:
        self.container_spec = obj

    def __call__(self) -> str:
        container = self._must_load_container(self.container_spec)
        assert isinstance(container, d.Collection | d.Phenotype)
        return container.name


class ResolveContainerSpecLocked(BaseInteractor):
    def set_parent(self, obj: d.ContainerSpec) -> None:
        self.container_spec = obj

    def __call__(self) -> bool:
        container = self._must_load_container(self.container_spec)
        assert isinstance(container, d.Collection | d.Phenotype)

        root_collection = self._must_load_root_collection_of(container)
        return root_collection.locked


class ResolveContainerSpecVisibility(BaseInteractor):
    def set_parent(self, obj: d.ContainerSpec | d.Collection) -> None:
        match obj:
            case d.ContainerSpec():
                self.container_spec = obj
            case d.Collection():
                self.container_spec = obj.to_spec()
            case _:
                raise TypeError(
                    f"Expected ContainerSpec or Collection, got {type(obj)}"
                )

    def __call__(self) -> d.CollectionVisibility:
        container = self._must_load_container(self.container_spec)
        assert isinstance(container, d.Collection | d.Phenotype)

        root_collection = self._must_load_root_collection_of(container)

        if d.PUBLIC_USER_ID in (u.id for u in root_collection.shared_with):
            return d.CollectionVisibility.Public

        if root_collection.owner_id == self.user.id:
            return d.CollectionVisibility.Private

        if self.user not in root_collection.shared_with:
            raise RuntimeError(
                f"Access Problem with collection {container.id}: "
                f"It is neither public, nor is it shared with or owned by the "
                f"user {self.user.id}"
            )

        return d.CollectionVisibility.Shared
