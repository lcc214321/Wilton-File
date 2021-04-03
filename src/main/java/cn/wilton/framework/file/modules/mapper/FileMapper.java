package cn.wilton.framework.file.modules.mapper;

import cn.wilton.framework.file.common.entity.FileEntity;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Select;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @author Ranger
 * @email wilton.icp@gmail.com
 * @since 2021/3/16
 */
@Repository
public interface FileMapper extends BaseMapper<FileEntity>{

}
