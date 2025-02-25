import * as React from 'react';
import { IconFileExport, IconSearch } from '@tabler/icons';
import {
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  // Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { donviSelector, reloadDataSelector, userLoginSelector } from 'store/selectors';
import { setLoading, setReloadData } from 'store/actions';
import { useTranslation } from 'react-i18next';
import { createSearchParams } from 'utils/createSearchParams';
import { handleResponseStatus } from 'utils/handleResponseStatus';
import { convertISODateToFormattedDate, formatDate } from 'utils/formatDate';
import MainCard from 'components/cards/MainCard';
import { getAllDanhmucTN } from 'services/sharedService';
import BackToTop from 'components/scroll/BackToTop';
import { styled } from '@mui/system';
import AnimateButton from 'components/extended/AnimateButton';
import { useFormik } from 'formik';
import { generateDocument } from '../sogoc/ExportWord';
import ExportExcel from '../sogoc/ExportExcel';
import { getHocSinhTheoSoCapPhatBang } from 'services/socapphatbangService';
import ButtonSuccess from 'components/buttoncolor/ButtonSuccess';

export default function SoCapPhatBang() {
  const isXs = useMediaQuery('(max-width:600px)');
  const { t } = useTranslation();
  const [search, setSearch] = useState(false);
  const reloadData = useSelector(reloadDataSelector);
  const donvi = useSelector(donviSelector);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dMTN, setDMTN] = useState([]);
  const [firstLoad, setFirstLoad] = useState(false);
  const [selectDanhmuc, setSelectDanhmuc] = useState('');
  const [disable, setDisable] = useState(false);
  const user = useSelector(userLoginSelector);

  const TableCell2 = styled(TableCell)(
    () => `
      border: 1px solid #ddd;
      font-size: 13px;
      padding: 8px;
    `
  );

  const TableCell1 = styled(TableCell)(
    () => `
      border: 1px solid #ddd;
      font-size: 13px;
      text-align: center;
      vertical-align: middle;
      padding: 5px;
    `
  );

  const [pageState, setPageState] = useState({
    isLoading: false,
    data: [],
    total: 0,
    order: 1,
    orderDir: 'ASC',
    startIndex: 0,
    pageSize: 25,
    DMTN: '',
    donVi: donvi.ten
  });

  const [pageState1, setPageState1] = useState({
    isLoading: false,
    data: [],
    total: 0,
    order: 1,
    orderDir: 'ASC',
    startIndex: 0,
    pageSize: -1,
    DMTN: '',
    donVi: donvi.ten
  });

  const handleSearch = () => {
    setSearch(true);
    const danhmucSelect = pageState.DMTN;
    const selectedDanhmucInfo = dMTN.find((dmtn) => dmtn.id === danhmucSelect);
    setSelectDanhmuc(selectedDanhmucInfo);
  };

  const handleExport = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    await ExportExcel(formik, pageState1, selectDanhmuc, donvi);
    dispatch(setLoading(false));
  };

  const handleExportWord = async (e) => {
    e.preventDefault();
    setLoading(true);
    await generateDocument(pageState1.data, additionalData);
    setLoading(false);
  };

  const handleChange = (e, value) => {
    e.preventDefault();
    setPageState((old) => ({ ...old, startIndex: value }));
  };

  const handleChangeRowsPerPage = (e) => {
    const newPageSize = e.target.value;
    setPageState((old) => ({ ...old, pageSize: newPageSize }));
  };

  useEffect(() => {
    const fetchDataDL = async () => {
      const danhmuc = await getAllDanhmucTN(user ? user.username : '');
      if (danhmuc.data && danhmuc.data.length > 0) {
        setDMTN(danhmuc.data);
        setPageState((old) => ({ ...old, DMTN: danhmuc.data[0].id }));
        setSelectDanhmuc(danhmuc.data[0]);
        setDisable(false);
      } else {
        setDMTN([]);
        setPageState((old) => ({ ...old, DMTN: '' }));
        setSelectDanhmuc('');
        setDisable(true);
      }
      dispatch(setLoading(false));
    };
    fetchDataDL();
  }, []);

  useEffect(() => {
    if (selectDanhmuc) {
      setFirstLoad(true);
    }
  }, [selectDanhmuc]);

  const formik = useFormik({
    initialValues: {
      UyBanNhanDan: '',
      CoQuanCapBang: '',
      QuyetDinh: '',
      NguoiKyBang: '',
      DiaPhuongCapBang: '',
      HeDaoTao: '',
      HinhThucDaoTao: '',
      NgayCapBang: ''
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      setPageState((old) => ({ ...old, isLoading: true }));
      const params = await createSearchParams(pageState);
      params.append('idDanhMucTotNghiep', pageState.DMTN);
      params.append('idTruong', donvi.id);
      const response = await getHocSinhTheoSoCapPhatBang(params);
      const data = response.data;
      formik.setValues({
        UyBanNhanDan: data.SoCapPhatBang.UyBanNhanDan || '',
        CoQuanCapBang: data.SoCapPhatBang.CoQuanCapBang || '',
        NamThi: data.DanhMucTotNghiep.NamThi || '',
        QuyetDinh: data.DanhMucTotNghiep.SoQuyetDinh || '',
        NguoiKyBang: data.SoCapPhatBang.NguoiKyBang || '',
        DiaPhuongCapBang: data.SoCapPhatBang.DiaPhuongCapBang || '',
        HeDaoTao: data.Truong.HeDaoTao.toUpperCase() || '',
        HinhThucDaoTao: data.Truong.HinhThucDaoTao || '',
        NgayCapBang: formatDate(data.DanhMucTotNghiep.NgayCapBang) || ''
      });
      const check = handleResponseStatus(response, navigate);
      if (check) {
        const data = await response.data.SoCapPhatBang;
        const dataWithIds = data.hocSinhs.map((row, index) => ({
          idx: pageState.startIndex * pageState.pageSize + index + 1,
          gioiTinh_fm: row.GioiTinh ? t('gender.male') : t('gender.female'),
          ngaySinh_fm: convertISODateToFormattedDate(row.NgaySinh),
          ...row
        }));
        dispatch(setReloadData(false));
        setPageState((old) => ({
          ...old,
          isLoading: false,
          data: dataWithIds,
          total: data.totalRow || 0
        }));
      } else {
        setIsAccess(false);
      }
    };
    if (firstLoad || search || reloadData) {
      fetchData();
      setSearch(false);
    }
  }, [pageState.search, pageState.order, pageState.orderDir, pageState.startIndex, pageState.pageSize, reloadData, firstLoad, search]);

  useEffect(() => {
    const fetchData = async () => {
      const params = await createSearchParams(pageState1);
      params.append('idDanhMucTotNghiep', pageState.DMTN);
      params.append('idTruong', donvi.id);
      const response = await getHocSinhTheoSoCapPhatBang(params);
      const check = handleResponseStatus(response, navigate);
      if (check) {
        const data = await response.data.SoCapPhatBang;
        const dataWithIds = data.hocSinhs.map((row, index) => ({
          idx: index + 1,
          gioiTinh_fm: row.GioiTinh ? t('gender.male') : t('gender.female'),
          ngaySinh_fm: convertISODateToFormattedDate(row.NgaySinh),
          ...row
        }));
        dispatch(setReloadData(false));
        setPageState1((old) => ({
          ...old,
          isLoading: false,
          data: dataWithIds,
          total: data.totalRow || 0
        }));
      } else {
        setIsAccess(false);
      }
    };
    if (firstLoad || search || reloadData) {
      fetchData();
    }
  }, [pageState.search, pageState.order, pageState.orderDir, pageState.startIndex, pageState.pageSize, reloadData, firstLoad, search]);

  const handleDanhMucChange = (event) => {
    const selectedValue = event.target.value;
    setPageState((old) => ({ ...old, DMTN: selectedValue }));
  };

  const additionalData = {
    uyBanNhanDan: formik.values.UyBanNhanDan.toUpperCase(),
    coQuanCapBang: formik.values.CoQuanCapBang.toUpperCase(),
    quyetDinh: formik.values.QuyetDinh,
    donVi: donvi.ten,
    namThi: formik.values.NamThi,
    title: `SỔ CẤP PHÁT BẰNG TỐT NGHIỆP ${formik.values.HeDaoTao.toUpperCase()}`,
    hinhThucDaoTao: formik.values.HinhThucDaoTao,
    diaPhuong: formik.values.DiaPhuongCapBang,
    ngayCap: formik.values.NgayCapBang,
    nguoiKy: formik.values.NguoiKyBang
  };

  // const count = pageState.total ? Math.floor(parseInt(pageState.total) / parseInt(pageState.pageSize)) + 1 : 0;

  return (
    <>
      <MainCard
        title={t('socapphatbang.title')}
        secondary={
          isXs ? (
            ''
          ) : (
            <Grid container justifyContent="flex-end" spacing={1}>
              <Grid item>
                <ButtonSuccess title={t('button.export.excel')} onClick={handleExport} icon={IconFileExport} />
              </Grid>
              <Grid item>
                <AnimateButton>
                  <Tooltip title={t('button.export.excel')} placement="bottom">
                    <Button fullWidth color="info" variant="contained" onClick={handleExportWord} startIcon={<IconFileExport />}>
                      {t('button.export.word')}
                    </Button>
                  </Tooltip>
                </AnimateButton>
              </Grid>
            </Grid>
          )
        }
      >
        {isXs ? (
          <Grid container justifyContent="flex-end" spacing={1}>
            <Grid item>
              <ButtonSuccess title={t('Xuất file excel')} onClick={handleExport} icon={IconFileExport} />
            </Grid>
            <Grid item>
              <AnimateButton>
                <Tooltip title={t('Xuất file word')} placement="bottom">
                  <Button fullWidth color="info" variant="contained" onClick={handleExportWord} startIcon={<IconFileExport />}>
                    {t('Xuất file word')}
                  </Button>
                </Tooltip>
              </AnimateButton>
            </Grid>
          </Grid>
        ) : (
          ''
        )}
        <Grid item container mb={1} spacing={1} mt={1} justifyContent={'center'}>
          <Grid item>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>{t('danhmuc.title')}</InputLabel>
              <Select name="id" value={pageState.DMTN} onChange={handleDanhMucChange} label={t('danhmuc.title')}>
                {dMTN && dMTN.length > 0 ? (
                  dMTN.map((dmtn) => (
                    <MenuItem key={dmtn.id} value={dmtn.id}>
                      {dmtn.tieuDe}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">No data available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              title={t('button.search')}
              fullWidth
              onClick={handleSearch}
              color="info"
              sx={{ marginTop: '2px' }}
              startIcon={<IconSearch />}
              disabled={disable}
            >
              {t('button.search')}
            </Button>
          </Grid>
        </Grid>
        {pageState.data.length > 0 ? (
          <>
            <Grid container justifyContent={'flex-start'}>
              <Grid item>
                {/* <Pagination count={count || 0} page={pageState.startIndex + 1 || 0} onChange={handleChange} /> */}
                <TablePagination
                  component="div"
                  count={pageState.total || 0}
                  page={pageState.startIndex || 0}
                  onPageChange={handleChange}
                  rowsPerPage={pageState.pageSize || 0}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage={t('Số dòng hiển thị')}
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count}`}
                />
              </Grid>
            </Grid>
          </>
        ) : (
          ''
        )}
        <Grid item mt={pageState.data.length > 0 ? 0 : 2}>
          <Divider />
        </Grid>
        <Grid item container spacing={1} mt={6}>
          <Grid
            item
            container
            lg={3}
            md={4}
            sm={4}
            xs={5}
            justifyContent={'center'}
            textAlign={'center'}
            flexDirection="column"
            alignItems="center"
          >
            <Typography variant="body1" fontSize={14}>
              {formik.values.UyBanNhanDan.toUpperCase()}
            </Typography>
            <Typography variant="h5" fontSize={15} fontWeight={'bold'}>
              {formik.values.CoQuanCapBang.toUpperCase()}
            </Typography>
            <Grid item mt={0}>
              <Divider width={120} />
            </Grid>
          </Grid>
          <Grid item lg={3} md={0.1} sm={1} xs={1}></Grid>
          <Grid item container lg={6} md={7.8} sm={7} xs={6} justifyContent={'center'} textAlign={'center'}>
            <Typography variant="h4" fontSize={18}>
              SỔ CẤP PHÁT BẰNG TỐT NGHIỆP {formik.values.HeDaoTao.toUpperCase()}
            </Typography>
          </Grid>
        </Grid>
        <Grid item container mb={3} spacing={1} mt={3}>
          <Grid item lg={9} md={8.8} sm={8} xs={7} flexDirection={'column'}>
            <Typography variant="body1" fontSize={14}>
              Quyết định công nhận tốt nghiệp số {formik.values.QuyetDinh}
            </Typography>
            <Typography variant="body1" fontSize={14}>
              Học sinh trường: {donvi.ten}
            </Typography>
          </Grid>
          <Grid item lg={3} md={3.2} sm={4} xs={5} flexDirection={'column'}>
            <Typography variant="body1" fontSize={14}>
              Năm tốt nghiệp: {formik.values.NamThi}
            </Typography>
            <Typography variant="body1" fontSize={14}>
              Hình thức học: {formik.values.HinhThucDaoTao}
            </Typography>
          </Grid>
        </Grid>
        <TableContainer component={Paper} style={{ border: '1px solid #ddd', borderRadius: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell1 style={{ width: '30px' }}>STT</TableCell1>
                <TableCell1 style={{ width: 'auto' }}>Họ và tên</TableCell1>
                <TableCell1 style={{ width: '110px' }}>CCCD</TableCell1>
                <TableCell1 style={{ width: '83px' }}>Ngày tháng năm sinh</TableCell1>
                <TableCell1 style={{ width: 'auto' }}>Nơi sinh</TableCell1>
                <TableCell1 style={{ width: '45px' }}>Giới tính</TableCell1>
                <TableCell1 style={{ width: 'auto' }}>Dân tộc</TableCell1>
                <TableCell1 style={{ width: '80px' }}>Xếp loại tốt nghiệp</TableCell1>
                <TableCell1 style={{ width: '100px' }}>Số hiệu văn bằng</TableCell1>
                <TableCell1 style={{ width: 'auto' }}>Số vào sổ gốc</TableCell1>
                <TableCell1 style={{ width: '87px' }}>Chữ ký người nhận</TableCell1>
                <TableCell1 style={{ width: '35px' }}>Ghi chú</TableCell1>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageState.data.map((row) => (
                <TableRow key={row.idx}>
                  <TableCell2 style={{ textAlign: 'center' }}>{row.idx}</TableCell2>
                  <TableCell2>{row.HoTen}</TableCell2>
                  <TableCell2>{row.CCCD}</TableCell2>
                  <TableCell2>{row.ngaySinh_fm}</TableCell2>
                  <TableCell2>{row.NoiSinh}</TableCell2>
                  <TableCell2>{row.gioiTinh_fm}</TableCell2>
                  <TableCell2>{row.DanToc}</TableCell2>
                  <TableCell2>{row.XepLoai}</TableCell2>
                  <TableCell2>{row.SoHieuVanBang}</TableCell2>
                  <TableCell2 style={{ textAlign: 'center' }}>{row.SoVaoSoCapBang}</TableCell2>
                  <TableCell2></TableCell2>
                  <TableCell2></TableCell2>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Grid item container spacing={1} mt={1}>
          <Grid item lg={8} md={7} sm={7} xs={6}></Grid>
          <Grid
            item
            container
            lg={4}
            md={5}
            sm={5}
            xs={6}
            flexDirection="column"
            alignItems="center"
            justifyContent={'center'}
            textAlign={'center'}
          >
            <Grid item>
              <Typography variant="body1" fontSize={14} style={{ fontStyle: 'italic' }}>
                {formik.values.DiaPhuongCapBang}, {formik.values.NgayCapBang}
              </Typography>
            </Grid>
            <Grid item mt={0.4}>
              <Typography variant="body1" fontSize={15} style={{ fontWeight: 'bold' }}>
                TRƯỞNG PHÒNG
              </Typography>
            </Grid>
            <Grid item mt={10}>
              <Typography variant="body1" fontSize={15} style={{ fontWeight: 'bold' }}>
                {formik.values.NguoiKyBang}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </MainCard>
      <BackToTop />
    </>
  );
}
